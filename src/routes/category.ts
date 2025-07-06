import { Router } from 'express';
import { categoryController } from '@/controllers/categoryController';
import { validateParams, validateQuery, schemas } from '@/middleware/validation';

const router = Router();

// Academic structure routes
router.get('/campuses', categoryController.getAllCampuses);
router.get('/campuses/:campusId/colleges', validateParams(schemas.objectId), categoryController.getCampusColleges);
router.get('/colleges/:collegeId/departments', validateParams(schemas.objectId), categoryController.getCollegeDepartments);
router.get('/departments/:departmentId/users', validateParams(schemas.objectId), validateQuery(schemas.pagination), categoryController.getDepartmentUsers);

// Statistics
router.get('/campuses/:campusId/stats', validateParams(schemas.objectId), categoryController.getCampusStats);
router.get('/colleges/:collegeId/stats', validateParams(schemas.objectId), categoryController.getCollegeStats);

// Complete structure
router.get('/structure', categoryController.getAcademicStructure);

export default router;