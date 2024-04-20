
const controllers = require('../controllers/controller')
const express = require('express')
const authenticationJWT = require('../middlewares/authenticationJWT')

const router = express.Router()

router.get('/',controllers.home)
router.get('/getcourse',controllers.getcourses)
router.post('/authorization',authenticationJWT,controllers.authorization)
router.get('/categorieslist',controllers.categorieslist)
router.post('/createcourse',controllers.createCourse)

module.exports = router;