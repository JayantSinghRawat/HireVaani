const router = require('express').Router();

router.get('/', (req, res) => res.render('landing'));
router.get('/login', (req, res) => res.render('login'));
router.get('/signup', (req, res) => res.render('signup'));
router.get('/dashboard', (req, res) => res.render('dashboard'));
router.get('/interview', (req, res) => res.render('interview'));
router.get('/result', (req, res) => res.render('result'));
router.get('/admin', (req, res) => res.render('admin'));

module.exports = router;
