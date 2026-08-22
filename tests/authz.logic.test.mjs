/**
 * Authorization logic tests.
 *
 * These run against the compiled `lib/authz.ts` — the real module the app uses,
 * not a copy — and cover the decisions the frontend makes on its own: reach
 * resolution, subject narrowing and delegation limits.
 *
 * Server-side enforcement is a separate concern and is tested in
 * `authz.api.test.mjs`, because a frontend test can never prove a boundary.
 *
 *   node tests/authz.logic.test.mjs
 */
import {
  ACTION,
  canDelegate,
  coversSubject,
  delegatableActions,
  resolveReach,
  ROLE_BLUEPRINTS,
  unenforcedActions,
} from '../.authz-build/authz.js';

let pass = 0, fail = 0;
const t = (name, actual, expected) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
  if (!ok) console.log(`        got ${JSON.stringify(actual)}\n        want ${JSON.stringify(expected)}`);
};

/* Permission sets exactly as the API returns them for each built-in role. */
const SUPER_ADMIN = ['*', 'org.billing', 'org.read', 'role.manage', 'task.create', 'task.update'];
const ORG_ADMIN = ['org.read','org.update','role.manage','program.create','program.read','program.update','program.delete','node.create','node.read','node.update','node.delete','timeline.read','timeline.update','task.create','task.read','task.update','venue.manage','audit.read'];
const COORDINATOR = ['program.read','node.create','node.read','node.update','timeline.read','timeline.update','task.create','task.read','task.update','venue.manage'];
const VOLUNTEER = ['program.read','node.read','timeline.read','task.read','task.update'];
const VIEWER = ['program.read','node.read','timeline.read','task.read'];
const MEMBER = VIEWER;

console.log('--- reach resolution ---');
t('super admin reaches everything', resolveReach(SUPER_ADMIN).get(ACTION.taskUpdate), 'organization');
t('org admin task.update is org-wide', resolveReach(ORG_ADMIN).get(ACTION.taskUpdate), 'organization');
t('coordinator task.update is org-wide', resolveReach(COORDINATOR).get(ACTION.taskUpdate), 'organization');
t('volunteer task.update narrows to assigned', resolveReach(VOLUNTEER).get(ACTION.taskUpdate), 'assigned');
t('viewer has no task.update', resolveReach(VIEWER).get(ACTION.taskUpdate), 'none');
t('volunteer cannot edit the schedule', resolveReach(VOLUNTEER).get(ACTION.nodeUpdate), 'none');
t('volunteer cannot manage roles', resolveReach(VOLUNTEER).get(ACTION.roleManage), 'none');
t('coordinator cannot manage roles', resolveReach(COORDINATOR).get(ACTION.roleManage), 'none');
t('coordinator cannot touch billing', resolveReach(COORDINATOR).get(ACTION.orgBilling), 'none');
t('org admin cannot delete the org', resolveReach(ORG_ADMIN).get(ACTION.orgDelete), 'none');

console.log('\n--- subject narrowing (test 6: volunteer vs another user\'s task) ---');
const ALICE = 'user-alice', BOB = 'user-bob';
const aliceTask = { assignments: [{ userId: ALICE }] };
const bobTask   = { assignments: [{ userId: BOB }] };
const orphanTask = { assignments: [] };

t('volunteer may update their own task',
  coversSubject('assigned', ALICE, { kind: 'task', task: aliceTask }), true);
t('volunteer may NOT update another user\'s task',
  coversSubject('assigned', ALICE, { kind: 'task', task: bobTask }), false);
t('volunteer may NOT update an unassigned task',
  coversSubject('assigned', ALICE, { kind: 'task', task: orphanTask }), false);
t('admin reach covers another user\'s task',
  coversSubject('organization', ALICE, { kind: 'task', task: bobTask }), true);
t('no reach covers nothing',
  coversSubject('none', ALICE, { kind: 'task', task: aliceTask }), false);
t('capability question passes without a subject',
  coversSubject('assigned', ALICE, undefined), true);
t('anonymous user is never assigned',
  coversSubject('assigned', null, { kind: 'task', task: aliceTask }), false);

console.log('\n--- delegation (tests 9 & 10: no granting or escalating beyond your own grants) ---');
t('coordinator cannot delegate role.manage',
  canDelegate(COORDINATOR, ['role.manage']), { allowed: false, missing: ['role.manage'] });
t('coordinator cannot delegate billing',
  canDelegate(COORDINATOR, ['org.billing']), { allowed: false, missing: ['org.billing'] });
t('coordinator can delegate what it holds',
  canDelegate(COORDINATOR, ['task.create','node.update']), { allowed: true, missing: [] });
t('volunteer cannot delegate task.create',
  canDelegate(VOLUNTEER, ['task.create']), { allowed: false, missing: ['task.create'] });
t('super admin can delegate anything',
  canDelegate(SUPER_ADMIN, ['org.billing','role.manage','org.delete']), { allowed: true, missing: [] });
t('partial overlap reports only what is missing',
  canDelegate(COORDINATOR, ['task.create','role.manage','org.billing']),
  { allowed: false, missing: ['role.manage','org.billing'] });
t('volunteer\'s grantable set is exactly what it holds',
  delegatableActions(VOLUNTEER).map(s => s.action).sort(),
  ['node.read','program.read','task.read','task.update','timeline.read'].sort());
t('member cannot delegate anything it lacks',
  canDelegate(MEMBER, ['node.update']), { allowed: false, missing: ['node.update'] });

console.log('\n--- role blueprints stay inside their category pools ---');
const POOLS = {
  ORGANIZATION_ADMIN: ['org.read','org.update','role.manage','program.create','program.read','program.update','program.delete','node.create','node.read','node.update','node.delete','timeline.read','timeline.update','task.create','task.read','task.update','venue.manage','audit.read'],
  COORDINATOR: ['program.read','node.create','node.read','node.update','timeline.read','timeline.update','task.create','task.read','task.update','venue.manage'],
  VOLUNTEER: ['program.read','node.read','timeline.read','task.read','task.update'],
  JURY: ['program.read','node.read','timeline.read','task.read'],
  MEMBER: ['program.read','node.read','timeline.read','task.read'],
};
for (const bp of ROLE_BLUEPRINTS) {
  const pool = POOLS[bp.category];
  const outside = bp.actions.filter(a => !pool.includes(a));
  t(`${bp.name} fits the ${bp.category} pool`, outside, []);
}

console.log('\n--- no blueprint silently exceeds its own description ---');
t('Operator cannot restructure the event',
  ROLE_BLUEPRINTS.find(b => b.key === 'operator').actions.includes('node.create'), false);
t('Task Manager cannot edit the schedule',
  ROLE_BLUEPRINTS.find(b => b.key === 'task-manager').actions.includes('node.update'), false);
t('Viewer holds no mutating action',
  ROLE_BLUEPRINTS.find(b => b.key === 'viewer').actions
    .some(a => /\.(create|update|delete|manage)$/.test(a)), false);
t('Event Admin cannot manage roles',
  ROLE_BLUEPRINTS.find(b => b.key === 'event-admin').actions.includes('role.manage'), false);
t('Event Admin cannot touch billing',
  ROLE_BLUEPRINTS.find(b => b.key === 'event-admin').actions.includes('org.billing'), false);
t('Volunteer holds no structural action',
  ROLE_BLUEPRINTS.find(b => b.key === 'volunteer').actions
    .some(a => ['node.create','node.update','node.delete','role.manage','venue.manage'].includes(a)), false);

console.log('\n--- unenforced actions are declared, not hidden ---');
const gaps = unenforcedActions().map(s => s.action).sort();
t('the three known client-only actions are flagged', gaps, ['org.read','role.manage','task.update']);
t('every flagged action explains the gap', unenforcedActions().every(s => Boolean(s.gap)), true);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
