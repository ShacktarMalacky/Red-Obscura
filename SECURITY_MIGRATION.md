# Firestore security migration and rollout

This change moves authoritative game writes out of the browser. Firestore client rules are default-deny for writes; the Admin SDK Cloud Functions remain privileged, so they validate identity, input, cooldowns, balances and membership and use transactions for related state updates.

## Mission data

Mission documents must declare the server-verified action(s) that advance them in an `eventos` array. Supported events in this migration are `mine`, `upgrade`, and `claimNode`. Do not assign an event by guessing from a title or description: review each mission's intended gameplay, then set the mapping. Missions without a configured event remain visible but cannot progress.

## Existing data migration

The migration script creates the public leaderboard projections and adds `clanId` metadata to old clan messages. It never changes player balances or mission progress.

1. Run a dry run with Firebase Application Default Credentials and the intended project selected:

   `GCLOUD_PROJECT=your-project npm run migrate:legacy-data --prefix functions`

2. Review the reported counts and back up the Firestore database.
3. Apply only after verifying the project and backup:

   `GCLOUD_PROJECT=your-project npm run migrate:legacy-data --prefix functions -- --apply`

4. Populate `eventos` on mission documents only after reviewing each mission's actual requirements.

## Deployment ordering

Do not deploy restrictive rules before callable functions and the web client are ready. In a Firebase staging project, deploy callable functions first, run the end-to-end flows, execute and review the legacy-data migration, deploy the Firestore indexes and wait for them to finish building, then deploy the new rules and frontend. Verify login/profile creation, mining cooldown, upgrades, node claims, clan chat/membership/banking, global chat and mission progression before production rollout. This PR does not deploy any Firebase resource.

## Validation limits

CI runs the Next.js production build, TypeScript Cloud Functions build, Firestore rules tests and callable-function integration tests against Firebase emulators. Emulator coverage is not a substitute for a staging-project rollout.
