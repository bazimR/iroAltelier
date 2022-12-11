const e = require('express');
const { response, json } = require('express');
var express = require('express');
const session = require('express-session');
var router = express.Router();
var twilio = require('../config/twilio');
const adminHelper = require('../helpers/adminHelper');
const cartHelper = require('../helpers/cartHelper');
const categoryHelper = require('../helpers/categoryHelper');
const productsHelper = require('../helpers/productsHelper');
const userHelper = require('../helpers/userHelper');
var upload = require('../middleware/multer')
var client = require("twilio")(twilio.accountSID, twilio.authToken)
function islogged(req, res, next) {
    if (req.session.user) {
        next()
    }
    else {
        req.session.returnTo = req.originalUrl
        res.redirect('/login')
    }
}
router.get('/', async (req, res) => {
    let category = await categoryHelper.getCate()
    let banner = await adminHelper.getBanner()
    productsHelper.getProduct().then((products) => {
        res.render('users/home', { loginStatus: req.session.loggedIn, products, banner, category })
    })
})
router
    .route('/login')
    .get((req, res) => {
        if (req.session.errEmail || req.session.noMobileExist || req.session.isUserBlocked) {
            res.render('users/login', {
                loginStatus: req.session.loggedIn,
                errMessage: req.session.errEmail,
                errMobile: req.session.noMobileExist,
                errBlocked: req.session.isUserBlocked
            })
            req.session.errEmail = false
            req.session.noMobileExist = false
            req.session.isUserBlocked = false
        }
        else {
            res.render('users/login')
        }

    })
    .post((req, res) => {
        userHelper.doLogin(req.body).then((response) => {
            if (response.status) {
                req.session.user = response.user
                if (!req.session.user.isBlocked) {
                    req.session.loggedIn = true
                    if (req.session.returnTo) {
                        let returnLink = req.session.returnTo
                        res.redirect(returnLink)
                    }
                    else {
                        res.redirect('/')
                    }
                }
                else {
                    req.session.isUserBlocked = "Looks like you are blocked!!"
                    res.redirect('/login')
                }
            }
            else {
                req.session.errEmail = "wrong credentials! Try again or Use mobile authentication"
                res.redirect('/login')
            }
        })
    })
router.post('/login/mobile', (req, res) => {
    userHelper.mobileCheck(req.body).then((response) => {
        if (response) {
            req.session.mobile = req.body.mobile
            client
                .verify
                .services(twilio.serviceID)
                .verifications
                .create({
                    to: `+91${req.body.mobile}`,
                    channel: "sms"
                }).then((data) => {
                    res.redirect('/login/verify')
                })
        }
        else {
            req.session.noMobileExist = "Not a registered Mobile!"
            res.redirect('/login')
        }
    })

})
router.route('/login/verify')
    .get((req, res) => {
        if (req.session.otpErr) {
            res.render('users/verify', { phone: req.session.mobile, errMessage: req.session.otpErr })
            req.session.otpErr = false
        }
        else {
            res.render('users/verify', { phone: req.session.mobile })
        }
    }
    )
    .post((req, res) => {
        var arr = Object.values(req.body)
        var otp = arr.toString().replaceAll(',', '');
        client
            .verify
            .services(twilio.serviceID)
            .verificationChecks
            .create({
                to: `+91${req.session.mobile}`,
                code: otp
            }).then((data) => {
                if (data.valid) {
                    userHelper.getUserMobile(req.session.mobile).then((user) => {
                        req.session.user = user
                        req.session.loggedIn = true
                        res.redirect('/')
                    })
                }
                else {
                    res.redirect('/login/verify')
                    req.session.otpErr = "Entered otp is Incorrect!"
                }
            })
    })
router.route('/signup')
    .get((req, res) => {
        if (req.session.userEmailExists || req.session.userMobileExists) {
            res.render('users/signup', { errMobileExists: req.session.userMobileExists })
            req.session.userEmailExists = false
            req.session.userMobileExists = false
        }
        else {
            res.render('users/signup')
        }
    })
    .post((req, res) => {
        if (req.body.referralcode == "") {
            userHelper.doSignup(req.body).then((response) => {
                if (response.mobile) {
                    req.session.userMobileExists = 'Email or Mobile already in use.'
                    res.redirect('/signup')
                }
                else {
                    res.redirect('/login')
                }
            })
        }
        else {
            userHelper.whenReferral(req.body.referralcode, req.body).then((response) => {
                if (response.mobile) {
                    req.session.userMobileExists = 'Email or Mobile already in use.'
                    res.redirect('/signup')
                }
                else {
                    res.redirect('/login')
                }
            }).catch((data) => {
                res.redirect('/login')
            })
        }
    })
router.get('/products/details', (req, res) => {
    productsHelper.detesProduct(req.query.id).then((products) => {
        res.render('users/productdetails', { products, loginStatus: req.session.loggedIn })
    })
})
router.get('/logout', (req, res) => {
    req.session.loggedIn = false
    req.session.user = false
    res.redirect('/')
})
router.route("/addtocart/:id")
    .get((req, res) => {
        if (req.session.loggedIn) {
            cartHelper.addToCart(req.params.id, req.session.user._id).then(() => {
                res.json({ status: true })
            })
        }
        else {
            res.redirect('/')
        }
    })
router.route("/cart")
    .get(islogged, async (req, res) => {
        if (req.session.loggedIn) {
            let cart = await cartHelper.getCartProducts(req.session.user._id)
            req.session.cart = cart
            if (cart.length === 0) {
                res.render("users/cart", { status: "Cart is empty", loginStatus: req.session.loggedIn })
            }
            else {
                let total = await cartHelper.getTotalOfProduct(req.session.user._id)
                res.render('users/cart', { loginStatus: req.session.loggedIn, loggedIn: req.session.loggedIn, cart, total })
            }

        }
        else {
            res.render('users/cart')
        }
    })
router.route("/change-quantity")
    .post((req, res) => {
        cartHelper.changeQuantity(req.body).then((response) => {
            res.json(response)
        }).catch((msg) => {
            console.log(msg);
        })
    })
router.route("/delete-product")
    .post((req, res) => {
        console.log(req.body);
        cartHelper.deleteProduct(req.body).then((response) => {
            res.json(response)
        })
    })
router.route("/address")
    .get(islogged, async (req, res) => {
        let cart = req.session.cart
        if (req.session.user) {
            if (cart.length === 0) {
                res.redirect('/')
            }
            else {
                if (req.session.ctotal) {
                    let total = req.session.ctotal
                    let userAddress = await userHelper.getAddress(req.session.user._id)
                    res.render("users/address", { user: req.session.user, loginStatus: req.session.loggedIn, userAddress, total })
                }
                else {
                    let total = await cartHelper.getTotalOfProduct(req.session.user._id)
                    let userAddress = await userHelper.getAddress(req.session.user._id)
                    res.render("users/address", { user: req.session.user, loginStatus: req.session.loggedIn, userAddress, total })
                }
            }
        }
        else {
            res.redirect('/login')
        }
    })
router.route("/addAddress")
    .post((req, res) => {
        userHelper.addAddress(req.body, req.session.user._id).then((response) => {
            res.json({ addAddress: true })
        })

    })
router.route("/place-order")
    .post(async (req, res) => {
        let orderItem = await userHelper.getOrderedItems(req.session.user._id)
        let selectedAddress = await userHelper.getSelectedAddress(req.body.address, req.session.user._id)
        if (req.session.ctotal) {
            let total = req.session.ctotal
            userHelper.placeOrder(selectedAddress, orderItem, total, req.session.user._id, req.body.payment, req.session.cId).then((order) => {
                console.log("<><>}{", order);
                req.session.orderId = order.insertedId
                req.session.total = total ///watchout pleeeeeeeeeeeeeeeeeeeease
                console.log(req.session.total, "]}}}}}}}");
                if (req.body['payment'] == 'COD') {
                    res.json({ COD: true })
                }
                else if (req.body['payment'] == 'RAZORPAY') {
                    userHelper.razorPayGenerate(order.insertedId, total).then((response) => {
                        response.RAZORPAY = true
                        res.json(response)
                    })
                }
                else {
                    userHelper.paypalGenerate(req.session.total).then((payment) => {
                        for (let i = 0; i < payment.links.length; i++) {
                            if (payment.links[i].rel == 'approval_url') {
                                res.json(payment.links[i])
                            }
                        }
                    })
                }
            })
        }
        else {
            let total = await cartHelper.getTotalOfProduct(req.session.user._id)
            userHelper.placeOrder(selectedAddress, orderItem, total, req.session.user._id, req.body.payment).then((order) => {
                console.log("<><>}{", order);
                req.session.orderId = order.insertedId
                req.session.total = total ///watchout pleeeeeeeeeeeeeeeeeeeease
                console.log(req.session.total, "]}}}}}}}");
                if (req.body['payment'] == 'COD') {
                    res.json({ COD: true })
                }
                else if (req.body['payment'] == 'RAZORPAY') {
                    userHelper.razorPayGenerate(order.insertedId, total).then((response) => {
                        response.RAZORPAY = true
                        res.json(response)
                    })
                }
                else {
                    userHelper.paypalGenerate(req.session.total).then((payment) => {
                        for (let i = 0; i < payment.links.length; i++) {
                            if (payment.links[i].rel == 'approval_url') {
                                res.json(payment.links[i])
                            }
                        }
                    })
                }
            })
        }
    })
router.route('/orders-preview')
    .get(islogged, async (req, res) => {
        if (req.session.user) {
            let orders = await userHelper.getOrdersPreview(req.session.user._id)
            console.log(orders, "fssssfs");
            res.render('users/orderpreview', { loginStatus: req.session.loggedIn, orders })
        }
        else {
            res.redirect('/login')
        }
    })
router.route('/orders/:id')
    .get(islogged, async (req, res) => {
        if (req.session.user) {
            let orders = await userHelper.getOrders(req.params.id)
            res.render('users/orders', { loginStatus: req.session.loggedIn, orders })
        }
        else {
            res.redirect('/login')
        }
    })
router.route('/request-cancel')
    .post((req, res) => {
        console.log(req.body);
        if (req.body.payment == "COD") {
            userHelper.requestCancel(req.body.order, req.body.product).then(() => {
                res.json({ request: true })
            })
        }
        else {
            userHelper.refundOrder(req.body.order, req.body.product, req.body.total, req.session.user).then(() => {
                res.json({ request: true })
            })
        }
    })
router.route('/thank-you')
    .get(islogged, (req, res) => {
        res.render('users/thankyou', { loginStatus: req.session.loggedIn })
    })
router.route("/verify-payment")
    .post((req, res) => {
        console.log(req.body, "wswswswsw");
        // alert("11111111")
        console.log(req.body["order[receipt]"]);
        userHelper.verifyRazor(req.body).then(() => {
            console.log('KIIIII');
            userHelper.changeStatus(req.body['order[receipt]']).then(() => {
                res.json({
                    status: true,
                });
            })
        }).catch((err) => {
            res.json({
                status: false,
                errMsg: "ff"
            })
        })
    })
router.route('/success')
    .get((req, res) => {
        const payerId = req.query.PayerID;
        const paymentId = req.query.paymentId;
        userHelper.verify(payerId, paymentId, req.session.total).then(() => {
            userHelper.changeStatus(req.session.orderId).then(() => {
                res.redirect("/thank-you");
            });
        });
    })
router.route('/profile')
    .get(islogged, (req, res) => {
        if (req.session.user) {
            userHelper.getWlletHistory(req.session.user._id).then((user) => {
                res.render('users/profile', { loginStatus: req.session.loggedIn, user })
            })
        }
        else {
            res.redirect("/login")
        }
    })
router.route("/coupon-apply")
    .post((req, res) => {
        userHelper.checkCoupon(req.session.user._id, req.body.coupon).then((response) => {
            console.log(response);
            let data = response
            res.json({ status: true, data })
        }).catch((response) => {
            res.json({ status: false })
        })
    })
router.route("/assign-coupon")
    .post((req, res) => {
        let total = req.body.total
        let couponId = req.body.id
        console.log(total, 'total');
        console.log(couponId);
        req.session.ctotal = total
        req.session.cId = couponId
        res.json({ status: true })
    })
router.route('/wishlist')
    .get(islogged, (req, res) => {
        if (req.session.user) {
            userHelper.getWish(req.session.user._id).then((products) => {
                res.render('users/wishlist', { products, loginStatus: req.session.loggedIn })
            })
        }
        else {
            res.redirect('/login')
        }
    })
router.route("/addwish")
    .post((req, res) => {
        userHelper.addWish(req.body.productId, req.session.user._id)
    })
router.route("/removewish")
    .post((req, res) => {
        console.log(req.body);
        userHelper.removeWish(req.body.wish, req.body.product).then((response) => {
            res.json(response)
        })
    })
router.route('/men')
    .get((req, res) => {
        userHelper.productMen().then((products) => {
            res.render('users/men', { loginStatus: req.session.loggedIn, products })
        })
    })
router.route('/women')
    .get((req, res) => {
        userHelper.productWomen().then((products) => {
            res.render('users/women', { loginStatus: req.session.loggedIn, products })
        })
    })
router.route('/accessories')
    .get((req, res) => {
        userHelper.productAccess().then((products) => {
            res.render('users/access', { loginStatus: req.session.loggedIn, products })
        })
    })
module.exports = router;
