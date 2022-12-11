const { response, json } = require('express');
var express = require('express');
const adminHelper = require('../helpers/adminHelper');
const categoryHelper = require('../helpers/categoryHelper');
const productsHelper = require('../helpers/productsHelper');
const userHelper = require('../helpers/userHelper');
var router = express.Router();
var upload = require('../middleware/multer')
function isAdmin(req, res, next) {
    if (req.session.isAdmin) {
        next()
    }
    else {
        res.redirect('/admin/login')
    }
}
router
    .route('/login')
    .get((req, res) => {
        res.render('admin/login', { errMessage: req.session.errAdmin })
        req.session.errAdmin = false
    })
    .post((req, res) => {
        adminHelper.doLogin(req.body).then((response) => {
            if (response.admin) {
                req.session.isAdmin = true
                res.redirect('/admin/')
            }
            else {
                req.session.isAdmin = false
                req.session.errAdmin = "Incorrect details!!"
                res.redirect('/admin/login')
            }

        })
    })
router.get('/logout', (req, res) => {
    console.log("loggout called");
    req.session.isAdmin = false
    res.redirect('/admin/login')
})
router.get('/', isAdmin, (req, res) => {
    res.render('admin/home')
})
router.get('/users', isAdmin, (req, res) => {
    userHelper.getUser().then((user) => {
        res.render('admin/users', { user })
    })

})
router.get('/block/:id', (req, res) => {
    let userId = req.params.id
    userHelper.doBlock(userId).then(() => {
        res.redirect('/admin/users')
    })
})
router.get('/unblock/:id', (req, res) => {
    let userId = req.params.id
    userHelper.doUnblock(userId).then(() => {
        res.redirect('/admin/users')
    })
})
router.get("/category", isAdmin, (req, res) => {
    categoryHelper.getCate().then((category) => {
        res.render('admin/category', { category })
    })
})
router.get("/category/add", (req, res) => {
    res.render('admin/addcategory')
})
router.post("/category/add", (req, res) => {
    console.log(req.body);
    categoryHelper.addCate(req.body).then((response) => {
        if (response.category) {
            req.session.categoryExists = "Category already exists"
            res.redirect('/admin/category/add')
        }
        else {
            res.redirect('/admin/category')
        }
    })
})
router.get("/category/delete/:id", (req, res) => {
    let cateId = req.params.id
    console.log(">>>>>>>" + cateId);
    categoryHelper.deleteCate(cateId).then(() => {
        res.redirect('/admin/category')
    })
})

router.get("/category/edit/:id", async (req, res) => {
    let cateId = req.params.id
    console.log(">>>>>++    :  " + cateId);
    let category = await categoryHelper.detesCate(req.params.id)
    console.log(category);
    res.render('admin/editcate', { category })

})
router.post('/category/edit/:id', async (req, res) => {
    console.log(req.body);
    categoryHelper.editCate(req.params.id, req.body).then((response) => {
        if (response.name) {
            req.session.categoryEditexists = "Category already exists"
            res.redirect('/admin/category/')
        }
        else {
            res.redirect("/admin/")
        }
    })
})
router.get('/products', isAdmin, (req, res) => {
    productsHelper.getProduct().then((products) => {
        res.render('admin/products', { products })
    })
})
router.get('/products/add/', isAdmin, (req, res) => {
    categoryHelper.getCate().then((category) => {
        res.render('admin/addproducts', { category })
    })
})
router.post('/products/add/', upload.array('image', 4), (req, res) => {
    const filesname = req.files.map(filename);
    function filename(file) {
        return file.filename;
    }
    let productDetails = req.body;
    productDetails.imageFilename = filesname;
    productsHelper.addProduct(productDetails).then(() => {
        res.redirect('/admin/products')
    })
})
router.get('/products/delete/:id', (req, res) => {
    let proId = req.params.id
    productsHelper.deleProduct(proId).then(() => {
        res.redirect('/admin/products/')
    })

})
router.get("/products/edit/:id", (req, res) => {
    categoryHelper.getCate().then(async (category) => {
        let products = await productsHelper.detesProduct(req.params.id).then((products) => {
            // console.log(products);
            res.render('admin/editproducts', { products, category })
        })
    })
})
router.post('/products/edit/:id', upload.array('image', 4), async (req, res) => {
    const filesname = req.files.map(filename)
    function filename(file) {
        return file.filename;
    }
    let proDetes = req.body;
    proDetes.imageFilename = filesname
    productsHelper.editProduct(req.params.id, proDetes).then(() => {
        res.redirect('/admin/products/')
    })
})
router.route('/orders')
    .get(isAdmin, async (req, res) => {
        await adminHelper.getAllOrders().then((orders) => {
            res.render('admin/orders', { orders })
        })
    })
router.route('/get-order/:id')
    .get(async (req, res) => {
        console.log('get order route', req.params.id);
        let orderData = await adminHelper.getOrder(req.params.id)
        console.log(orderData, "kkkkkkkkkkkkkkkkk");
        let total = orderData.total
        console.log(total, "fff");
        console.log(orderData);
        res.render('admin/orderthis', { orderData, total })
    })

router.route('/cancel')
    .post((req, res) => {
        console.log(req.body);
        adminHelper.cancelItem(req.body.order, req.body.product, req.body.user).then(() =>
            res.json({ cancel: true }))
    })
router.route('/dispatch')
    .post((req, res) => {
        adminHelper.dispatch(req.body.order, req.body.product).then(() => {
            res.json({ dispatch: true })
        })
    })
router.route('/delayed')
    .post((req, res) => {//cmt
        adminHelper.delayed(req.body.order, req.body.product).then(() => {
            res.json({ delayed: true })
        })
    })
router.route('/delivered')
    .post((req, res) => {
        adminHelper.delivered(req.body.order, req.body.product).then(() => {
            res.json({ delivered: true })
        })
    })
router.route('/payment-chart')
    .get(async (req, res) => {
        let data = await adminHelper.paymentChart();
        const count = data.map((key) => { return key.count })
        const name = data.map((key) => {
            return key._id
        })
        res.json({ name, count })
    })
router.route('/amount-chart')
    .get(async (req, res) => {
        let data = await adminHelper.amountChart();
        const sum = data.map((key) => { return key.sum })
        const name = data.map((key) => {
            return key._id
        })
        res.json({ name, sum })
    })
router.route("/coupon")
    .get((req, res) => {
        adminHelper.getCoupon().then((coupon) => {
            res.render("admin/coupon", { coupon })
        })
    })
router.route('/coupon/add')
    .get((req, res) => {
        res.render("admin/addcoupon")
    })
    .post((req, res) => {
        console.log(req.body);
        adminHelper.addCoupon(req.body).then(() => {
            res.redirect("/admin/coupon")
        })
    })
router.route("/coupon/delete/:id")
    .get((req, res) => {
        couponId = req.params.id
        console.log(couponId);
        adminHelper.deleteCoupon(couponId).then(() => {
            res.redirect('/admin/coupon')
        })
    })
router.route('/banners')
    .get((req, res) => {
        adminHelper.getBanner().then((banner) => {
            res.render('admin/banner', { banner })
        })
    })
router.route('/banner/add')
    .get((req, res) => {
        res.render('admin/addbanner')
    })
    .post(upload.array('image', 4), (req, res) => {
        const filesname = req.files.map(filename);
        function filename(file) {
            return file.filename;
        }
        let bannerDetes = req.body;
        bannerDetes.imageFilename = filesname;
        adminHelper.addBanner(bannerDetes).then(() => [
            res.redirect('/admin/banners')
        ])
    })
router.route('/totaluser')
    .post((req, res) => {
        adminHelper.totalUser().then((data) => {
            res.json({ total: data })
        })
    })
router.route('/totalamount')
    .post((req, res) => {
        adminHelper.totalAmount().then((data) => {
            res.json({ sum: data })
        })
    })
router.route('/totalproduct')
    .post((req, res) => {
        adminHelper.totalProduct().then((data) => {
            res.json({ total: data })
        })
    })
router.route('/thismonth')
    .post((req, res) => {
        adminHelper.thisMonth().then((data) => {
            res.json({ total: data })
        })
    })
module.exports = router;
