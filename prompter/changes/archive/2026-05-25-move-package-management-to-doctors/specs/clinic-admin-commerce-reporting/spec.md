## REMOVED Requirements
### Requirement: Admin Package Catalog Management
**Reason**: Package catalog management has been reassigned to doctors under the new `clinic-doctor-package-management` capability. Doctors are the clinical decision-makers who configure wellness packages and manage pricing aligned with treatment plans.
**Migration**: Existing package catalog management functionality moves to `/doctor/packages` routes with `DoctorPackageController`. Admin users lose write access to the package catalog; admin revenue reporting and conversion analytics remain unchanged.
