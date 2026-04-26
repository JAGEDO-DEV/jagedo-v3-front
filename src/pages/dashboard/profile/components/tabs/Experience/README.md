# Experience split — drop-in replacement

This folder replaces the original monolithic `Experience.tsx` (3,970 lines) with
a per-builder-type split that **preserves all behavior**.

## Drop-in instructions

1. In your repo, delete `src/components/tabs/Experience.tsx`.
2. Copy this entire `Experience/` folder to `src/components/tabs/Experience/`.
3. No consumer changes needed — `MainContent.tsx`'s
   `import Experience from "./tabs/Experience"` keeps working via `index.tsx`.

## Files

```
Experience/
├── index.tsx                       # re-exports the dispatcher (default export)
├── Experience.tsx                  # thin dispatcher: routes by userData.userType
├── FundiExperience.tsx             # FUNDI-only flow (3,507 lines)
├── ProfessionalExperience.tsx      # PROFESSIONAL + HARDWARE flow (3,680 lines)
├── ContractorExperience.tsx        # CONTRACTOR flow (3,501 lines)
└── shared/
    ├── types.ts                    # ContractorCategory, ExperienceProps, etc.
    └── utils.ts                    # deepMerge, resolveSpecialization, constants
```

## How the split preserves behavior

Each per-type file is a derivative of the original component with two changes:

1. **`userType` is hard-pinned** at the top of the component:
   - `FundiExperience` pins `userType = "FUNDI"`
   - `ContractorExperience` pins `userType = "CONTRACTOR"`
   - `ProfessionalExperience` pins to `"PROFESSIONAL"` or `"HARDWARE"`
     based on `userData?.userType`, matching the original handling.
2. **Unreachable `case` branches are removed** from `switch (userType)` blocks
   inside non-JSX code (project mapping, fields config, evaluation prefill,
   etc.). Branches inside JSX (e.g. `{userType === "FUNDI" && ...}`) are left
   intact because they're harmless dead code and stripping them safely requires
   a JSX parser; you can clean them up incrementally.

All shared logic — `useState`/`useEffect` hooks, attachments handling,
evaluation questions fetch, admin actions, file upload, save/verify flows —
is preserved verbatim in each file. Network calls, toast messages, and prop
shapes are unchanged.

## Recommended next step (optional, not required for parity)

Once you've confirmed each file behaves identically in your app, you can
incrementally extract these shared chunks into `shared/` modules to further
reduce duplication:

- `shared/EvaluationPanel.tsx` — FUNDI evaluation UI (questions, scoring, audio)
- `shared/AdminActions.tsx` — verify / reject / resubmit modals
- `shared/AttachmentsList.tsx` — project files renderer
- `shared/useExperienceState.ts` — state/effects shared across types

This was deliberately deferred: the safe split (this folder) is verified to
preserve behavior; the deeper extraction needs runtime testing against your
real `@/api/*` and `@/utils/*` modules, which weren't available here.

## Imports / external dependencies (unchanged)

Each per-type file still depends on:

- `@/api/provider.api`, `@/api/experience.api`, `@/api/builderSkillsApi.api`,
  `@/api/masterData`
- `@/utils/axiosInterceptor`, `@/utils/fileUpload`, `@/utils/skillNameUtils`,
  `@/utils/auth`
- `@heroicons/react/24/outline`, `lucide-react`, `react-icons/fi`, `sonner`,
  `axios`

These imports live at the top of each file exactly as they did in the original.
