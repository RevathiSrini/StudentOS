# Security Specification: StudentOS RBAC and Firestore Security

## 1. Data Invariants
1. **User Identity Boundary**: A user profile document `/users/{userId}` can only be read or written by the authenticated user whose `request.auth.uid == userId`. Role escalation (`role: "coach"`, `isAdmin`) cannot be self-assigned.
2. **Student Privacy Invariant**: A student document `/students/{studentId}` and its subcollections (`subjects`, `topics`, `assignments`, `assessments`, `trainingSessions`, `weeklyPlans`) are accessible only to:
   - The student themselves (`request.auth.uid == studentId`)
   - Authorized parents whose `userId` is in `parentIds` list on the student record
   - Authorized coaches whose `userId == primaryCoachId`
3. **Parent Isolation**: A parent can NEVER read, query, or mutate another student's record that does not list the parent's UID in `parentIds`.
4. **Weekly Plan Mutability**: Only the student or assigned coach can update or create a weekly plan.
5. **Course Materials Read-Only**: Official curriculum `/courseMaterials/{id}` is read-only for authenticated students, parents, and coaches, with writes blocked to client SDKs.
6. **Immutable Key Safeguards**: Document IDs and `studentId` cannot be swapped during updates (`incoming().studentId == existing().studentId`).

---

## 2. The "Dirty Dozen" Invalidation Payloads (Red Team Tests)

1. **Payload 1 (Parent Cross-Student Breach)**: Parent A attempts to read `/students/student_liam_chen/assignments` when only authorized for `student_maya_patel`.
   - *Result*: PERMISSION_DENIED.
2. **Payload 2 (Role Escalation via Profile Update)**: Student attempts to update their own role from `student` to `coach` or `admin`.
   - *Result*: PERMISSION_DENIED.
3. **Payload 3 (Arbitrary Identity Spoofing on Assignment)**: Attacker attempts to create an assignment with `studentId: "other_student"`.
   - *Result*: PERMISSION_DENIED.
4. **Payload 4 (Massive Buffer Attack on Topic Name)**: Attacker attempts to write a 1MB string into topic `name` field.
   - *Result*: PERMISSION_DENIED (`.size() <= 128` check).
5. **Payload 5 (Unauthenticated Data Harvest)**: Anonymous unauthenticated client queries `/students`.
   - *Result*: PERMISSION_DENIED.
6. **Payload 6 (Course Material Modification)**: Student attempts to edit the official geometry curriculum in `/courseMaterials/geom_01`.
   - *Result*: PERMISSION_DENIED.
7. **Payload 7 (Ghost Field Injection / Shadow Update)**: Client writes `{ "isHonorsGraduated": true }` to `/students/{studentId}`.
   - *Result*: PERMISSION_DENIED (strict key validation).
8. **Payload 8 (Training Session Hijack)**: Unrelated user attempts to delete a student's high-intensity training session.
   - *Result*: PERMISSION_DENIED.
9. **Payload 9 (Assessment Date Forgery)**: Client attempts to push an assessment date with invalid characters or excessive payload.
   - *Result*: PERMISSION_DENIED.
10. **Payload 10 (Direct Modification of System Mastery)**: Client attempts to overwrite mastery history bypassing calculation.
    - *Result*: PERMISSION_DENIED.
11. **Payload 11 (Blanket Collection Scrape)**: Client runs query `collection("students")` without specifying access boundaries.
    - *Result*: PERMISSION_DENIED.
12. **Payload 12 (Path Poisoning Attack)**: Injecting non-alphanumeric special characters into document paths.
    - *Result*: PERMISSION_DENIED (`isValidId()` regex check).
