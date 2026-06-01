## REMOVED Requirements
### Requirement: Patient Self-Registration
**Reason**: Transitioning to a staff-only workflow where patients no longer access the system directly.
**Migration**: Delete public registration routes and views.

### Requirement: OTP-Based Patient Verification
**Reason**: Transitioning to a staff-only workflow.
**Migration**: Delete OTP verification logic and routes.

### Requirement: Session-Based Patient Login and Logout
**Reason**: Transitioning to a staff-only workflow.
**Migration**: Remove patient-specific session logic.
