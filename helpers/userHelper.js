var db = require("../config/connection")
require('dotenv').config()
var collections = require("../config/collections")
var bcrypt = require('bcrypt')
const { response } = require("express")
const { Prompt } = require("twilio/lib/twiml/VoiceResponse")
var objectId = require('mongodb').ObjectId
const Razorpay = require('razorpay');
const { ObjectId, ObjectID } = require("mongodb")
const referralCodes = require("referral-codes")
var instance = new Razorpay({
    key_id: process.env.key_id,
    key_secret: process.env.key_secret,
});
var paypal = require('paypal-rest-sdk');

paypal.configure({
    'mode': 'sandbox', //sandbox or live
    'client_id': process.env.paypal_client_id ,
    'client_secret': process.env.paypal_client_secret
});
module.exports = {
    doSignup: (userData) => {
        return new Promise(async (resolve, reject) => {
            let password = await bcrypt.hash(userData.password, 10)
            let referralcode = referralCodes.generate({
                count: 1,
                prefix: userData.name,
                postfix: new Date().getFullYear()
            });
            let userObj = {
                name: userData.name,
                email: userData.email,
                mobile: userData.mobile,
                password: password,
                isBlocked: false,
                referralcode: referralcode[0],
                walletbalance: 0
            }
            db.get().collection(collections.USERS_COLLECTIONS).findOne({ $or: [{ email: userData.email }, { mobile: userData.mobile }] }).then((response) => {
                if (response) {
                    resolve(response)
                }
                else {
                    db.get().collection(collections.USERS_COLLECTIONS).insertOne(userObj).then((data) => {
                        resolve(data)
                    })
                }
            })
        })
    },
    whenReferral: (code, userData) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collections.USERS_COLLECTIONS).findOne({ referralcode: code }).then(async (data) => {
                console.log(data);
                if (data) {
                    db.get().collection(collections.USERS_COLLECTIONS).updateOne({ _id: objectId(data._id) }, {
                        $push: {
                            "wallethistory": {
                                from: "refferal",
                                amount: "1000"
                            }
                        }
                    })
                    db.get().collection(collections.USERS_COLLECTIONS).updateOne({ _id: objectId(data._id) }, { $inc: { walletbalance: 1000 } }).then(async () => {
                        let password = await bcrypt.hash(userData.password, 10)
                        let referralcode = referralCodes.generate({
                            count: 1,
                            prefix: userData.name,
                            postfix: new Date().getFullYear()
                        });
                        let userObj = {
                            name: userData.name,
                            email: userData.email,
                            mobile: userData.mobile,
                            password: password,
                            isBlocked: false,
                            referralcode: referralcode[0],
                            walletbalance: 1000
                        }
                        db.get().collection(collections.USERS_COLLECTIONS).findOne({ $or: [{ email: userData.email }, { mobile: userData.mobile }] }).then((response) => {
                            if (response) {
                                resolve(response)
                            }
                            else {
                                db.get().collection(collections.USERS_COLLECTIONS).insertOne(userObj).then((data) => {
                                    resolve(data)
                                })
                            }
                        })
                    })
                }
                else {
                    let password = await bcrypt.hash(userData.password, 10)
                    let referralcode = referralCodes.generate({
                        count: 1,
                        prefix: userData.name,
                        postfix: new Date().getFullYear()
                    });
                    let userObj = {
                        name: userData.name,
                        email: userData.email,
                        mobile: userData.mobile,
                        password: password,
                        isBlocked: false,
                        referralcode: referralcode[0],
                        walletbalance: 0
                    }
                    db.get().collection(collections.USERS_COLLECTIONS).insertOne(userObj)
                    reject("Referral doesnt exist")
                }
            })
        })
    },
    doLogin: (userData) => {
        return new Promise(async (resolve, reject) => {
            let response = {}
            let user = await db.get().collection(collections.USERS_COLLECTIONS).findOne({ email: userData.email })
            if (user) {
                bcrypt.compare(userData.password, user.password).then((status) => {
                    if (status) {
                        console.log("user logged");
                        response.user = user
                        response.status = true
                        resolve(response)
                    }
                    else {
                        console.log("logging failed");
                        resolve(response.status = false)
                    }
                })
            }
            else {
                console.log("login failed");
                resolve(response.status = false)
            }

        })
    },
    getUser: () => {
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collections.USERS_COLLECTIONS).find().toArray()
            resolve(user)
        })
    },
    getUserMobile: (userData) => {
        return new Promise(async (resolve, reject) => {
            let response = {}
            let user = await db.get().collection(collections.USERS_COLLECTIONS).findOne({ mobile: userData })
            resolve(user)
        })
    },
    doBlock: (userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.USERS_COLLECTIONS).updateOne({ _id: objectId(userId) }, {
                $set: {
                    isBlocked: true
                }
            }).then((response) => {
                resolve(response)
            })
        })
    },
    doUnblock: (userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.USERS_COLLECTIONS).updateOne({ _id: objectId(userId) }, {
                $set: {
                    isBlocked: false
                }
            }).then((response) => {
                resolve(response)
            })
        })
    },
    mobileCheck: (data) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.USERS_COLLECTIONS).findOne({ mobile: data.mobile }).then((response) => {
                resolve(response)
            })
        })
    },
    addAddress: (data, userId) => {
        return new Promise((resolve, reject) => {
            let newAddress = {
                _id: objectId(),
                email: data.email,
                phone: data.phone,
                address: data.address,
                pincode: data.pincode,
                city: data.city,
                isDefault: false
            }
            db.get().collection(collections.USERS_COLLECTIONS).updateOne(
                {
                    _id: objectId(userId)
                },
                {
                    $push: {
                        address: newAddress
                    }
                }
            ).then((response) => {
                resolve(response)
            })
        })
    },
    getAddress: (userId) => {
        return new Promise(async (resolve, reject) => {
            let address = await db.get().collection(collections.USERS_COLLECTIONS).aggregate([
                {
                    $match: {
                        _id: objectId(userId)
                    }
                },
                {
                    $project: {
                        _id: 1,
                        address: 1
                    }
                },
                {
                    $unwind: "$address"
                }
            ]).toArray()
            console.log(address);
            resolve(address)
        })
    },
    getOrderedItems: (userId) => {
        // console.log(userId);
        return new Promise(async (resolve, reject) => {
            let items = await db.get().collection(collections.CARTS_COLLECTION).aggregate([
                {
                    $match: {
                        user: objectId(userId)
                    }
                },
                {
                    $unwind: "$products"
                },
                {
                    $project: {
                        item: "$products.item",
                        Qty: "$products.Qty",
                        requestcancel: "$products.cancelrequest"
                    }
                },
                {
                    $lookup: {
                        from: collections.PRODUCTS_COLLECTION,
                        localField: "products.item",
                        foreignField: "_id",
                        as: "product"
                    }
                },
                {
                    $project: {
                        requestcancel: 1,
                        item: 1,
                        Qty: 1,
                        product: {
                            $arrayElemAt: ["$product", 0]
                        }
                    }
                }
            ]).toArray()
            console.log(">>>>" + items);
            resolve(items)
        })
    },
    getSelectedAddress: (addressId, userId) => {
        return new Promise(async (resolve, reject) => {
            let address = await db.get().collection(collections.USERS_COLLECTIONS).aggregate([
                {
                    $match: {
                        _id: objectId(userId)
                    }
                },
                {
                    $unwind: "$address"
                },
                {
                    $match: {
                        "address._id": objectId(addressId)
                    }
                },
                {
                    $project: {
                        _id: 0,
                        address: 1
                    }
                }
            ]).toArray()
            resolve(address)
        })
    },
    placeOrder: (address, products, total, userId, payment, cId) => {
        // console.log("this is"+address[0].address.email);
        return new Promise((resolve, reject) => {
            console.log(address, products, total, userId, payment);
            let status = payment === 'COD' ? 'Placed' : 'pending'
            let orderObj = {
                orderDate: new Date().getDate() + "-" + (new Date().getMonth() + 1) + "-" + new Date().getFullYear(),
                orderTime: new Date().getHours() + ":" + new Date().getMinutes(),
                time: new Date().getTime(),
                deliveryDetails: {
                    email: address[0].address.email,
                    mobile: address[0].address.phone,
                    address: address[0].address.address,
                    pincode: address[0].address.pincode,
                    city: address[0].address.city
                },
                userId: objectId(userId),
                paymentMethod: payment,
                products: products,
                total: total,
                status: status
            }
            db.get().collection(collections.ORDER_COLLECTION).insertOne(orderObj).then(async (response) => {
                let coupon = await db.get().collection(collections.COUPON_COLLECTION).findOne({ _id: objectId(cId) })
                db.get().collection(collections.USERS_COLLECTIONS).updateOne({ _id: objectId(userId) }, {
                    $push: {
                        coupons: coupon
                    }
                })
                resolve(response)
            })
        })
    },
    getOrdersPreview: (userId) => {
        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collections.ORDER_COLLECTION).aggregate([
                {
                    $match: {
                        $and:[
                        {userId: objectId(userId)},
                        {status:"Placed"}
                        ]
                    }
                },
                {
                    $project: {
                        deliveryDetails: 1,
                        cancelrequest: '$products.cancelrequest',
                        paymentMethod: 1,
                        total: 1,
                        orderDate: 1,
                        orderTime: 1,
                        time: 1,
                        status: 1
                    }
                },
                {
                    $lookup: {
                        from: collections.PRODUCTS_COLLECTION,
                        localField: "product",
                        foreignField: "_id",
                        as: 'cartItems'
                    }
                },
                {
                    $project: {
                        deliveryDetails: 1,
                        cancelrequest: 1,
                        userId: 1,
                        name: 1,
                        mobile: 1,
                        paymentMethod: 1,
                        product: 1,
                        status: 1,
                        quantity: 1,
                        total: 1,
                        orderDate: 1,
                        orderTime: 1,
                        time: 1,
                        orderstatus: 1,
                        products: {
                            $arrayElemAt: ["$cartItems", 0]
                        }
                    }
                },
                {
                    $sort: {
                        time: -1
                    }
                }
            ]).toArray()
            resolve(orders)
            console.log('thiss order',
                orders);
        })
    },
    getOrders: (orderId) => {
        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collections.ORDER_COLLECTION).aggregate([
                {
                    $match: {
                        _id: objectId(orderId)
                    }
                },
                {
                    $unwind: "$products"
                },
                {
                    $project: {
                        deliveryDetails: 1,
                        cancelrequest: '$products.cancelrequest',
                        userId: 1,
                        name: 1,
                        mobile: 1,
                        paymentMethod: 1,
                        product: '$products.item',
                        quantity: "$products.Qty",
                        orderstatus: "$products.status",
                        status: 1,
                        total: 1,
                        orderDate: 1,
                        orderTime: 1,
                        time: 1
                    }
                },
                {
                    $lookup: {
                        from: collections.PRODUCTS_COLLECTION,
                        localField: "product",
                        foreignField: "_id",
                        as: 'cartItems'
                    }
                },
                {
                    $project: {
                        deliveryDetails: 1,
                        cancelrequest: 1,
                        userId: 1,
                        name: 1,
                        mobile: 1,
                        paymentMethod: 1,
                        product: 1,
                        status: 1,
                        quantity: 1,
                        total: 1,
                        orderDate: 1,
                        orderTime: 1,
                        time: 1,
                        orderstatus: 1,
                        products: {
                            $arrayElemAt: ["$cartItems", 0]
                        }
                    }
                },
                {
                    $sort: {
                        time: -1
                    }
                }
            ]).toArray()
            resolve(orders)
            console.log(orders);
        })
    },
    requestCancel: (orderId, proId) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection(collections.ORDER_COLLECTION)
                .updateOne({ _id: objectId(orderId), "products.item": objectId(proId) }, {
                    $set: {
                        "products.$.cancelrequest": true
                    }
                }).then(() => {
                    resolve()
                })
        })
    },
    razorPayGenerate: (orderId, total) => {
        return new Promise((resolve, reject) => {
            var options = {
                amount: total * 100,
                currency: "INR",
                receipt: '' + orderId
            };
            instance.orders.create(options, function (err, order) {
                if (err) {
                    console.log("this is error",err);
                }
                else {
                    // console.log("paypal", order);
                    resolve(order)
                }
            })
        })
    },
    verifyRazor: (details) => {
        return new Promise((resolve, reject) => {
            const crypto = require("crypto")
            let hmac = crypto.createHmac('sha256', process.env.key_secret)
                .update(details["payment[razorpay_order_id]"] +
                    "|" +
                    details["payment[razorpay_payment_id]"])
                .digest("hex");
            if (hmac == details["payment[razorpay_signature]"]) {
                console.log('KIII');
                resolve();
            } else {
                console.log('POOOOO');
                reject();
            }
        })
    },
    changeStatus: (orderId) => {
        console.log("Sgshfs", orderId);
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collections.ORDER_COLLECTION).updateOne({ _id: ObjectId(orderId) }, {
                $set: {
                    status: "Placed"
                }
            }).then(() => {
                resolve()
            })
        })
    },
    paypalGenerate: (total) => {
        return new Promise((resolve, reject) => {
            var create_payment_json = {
                "intent": "sale",
                "payer": {
                    "payment_method": "paypal"
                },
                "redirect_urls": {
                    "return_url": "http://localhost:3000/success",
                    "cancel_url": "http://localhost:3000/cancel"
                },
                "transactions": [{
                    "item_list": {
                        "items": [{
                            "name": "item",
                            "sku": "item",
                            "price": total,
                            "currency": "USD",
                            "quantity": 1
                        }]
                    },
                    "amount": {
                        "currency": "USD",
                        "total": total
                    },
                    "description": "This is the payment description."
                }]
            };

            paypal.payment.create(create_payment_json, function (error, payment) {
                if (error) {
                    throw error;
                } else {
                    resolve(payment)
                }
            });
        })
    },
    verify: (payerId, paymentId, total) => {
        return new Promise((resolve, reject) => {
            const execute_payment_json = {
                payer_id: payerId,
                transactions: [
                    {
                        "amount": {
                            "currency": "USD",
                            "total": total,
                        },
                    },
                ],
            };
            paypal.payment.execute(
                paymentId,
                execute_payment_json,
                function (error, payment) {
                    if (error) {
                        console.log(error.response);
                        throw error;
                    } else {
                        console.log(JSON.stringify(payment));
                        resolve();
                    }
                }
            );
        });
    },
    checkCoupon: (userId, couponCode) => {
        console.log(couponCode);
        return new Promise(async (resolve, reject) => {
            let coupon = await db.get().
                collection(collections.COUPON_COLLECTION).findOne({ name: couponCode })
            if (coupon) {
                console.log(coupon.expirydate, new Date());
                let cId = coupon._id;
                if (new Date(coupon.expirydate) >= new Date()) {
                    let ifUsed = await db.get().collection(collections.USERS_COLLECTIONS).findOne({
                        $and: [
                            {
                                _id: objectId(userId)
                            },
                            {
                                coupons: {
                                    $elemMatch: {
                                        name: coupon.name
                                    }
                                }
                            }
                        ]
                    })
                    if (ifUsed) {
                        reject("User already used this Coupon Once")
                    }
                    else {
                        console.log("hi")
                        resolve(coupon)
                    }
                }
            }
            else {
                console.log("invalid Coupon");
                reject("invalid Coupon")
            }
        })
    },
    addWish: (proId, userId) => {
        let proObj = {
            item: objectId(proId)
        }
        return new Promise(async (resolve, reject) => {
            let userWish = await db.get().collection(collections.WISHLIST_COLLECTION).findOne({ user: objectId(userId) })
            if (userWish) {
                let proExist = userWish.products.findIndex((product) => { return product.item == proId })
                console.log(proExist);
                if (proExist != -1) {
                    db.get().collection(collections.WISHLIST_COLLECTION).updateOne({ user: objectId(userId), 'products.item': objectId(proId) }, {
                        $inc: { 'products.$.Qty': 1 }
                    }).then(() => {
                        resolve()
                    })
                }
                else {
                    db.get().collection(collections.WISHLIST_COLLECTION).updateOne({ user: objectId(userId) }, {
                        $push: { "products": proObj }
                    }).then((response) => {
                        resolve(response)
                    })
                }
            }
            else {
                let userWish = {
                    user: objectId(userId),
                    products: [proObj]
                }
                db.get().collection(collections.WISHLIST_COLLECTION).insertOne(userWish).then((response) => {
                    resolve(response)
                })
            }
        })
    },
    getWish: (userId) => {
        return new Promise(async (resolve, reject) => {
            let wishlist = await db.get().collection(collections.WISHLIST_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: "$products"
                }
                ,
                {
                    $project: {
                        item: "$products.item",
                        Qty: "$products.Qty",
                    }
                }
                ,
                {
                    $lookup: {
                        from: collections.PRODUCTS_COLLECTION,
                        localField: 'item',
                        foreignField: "_id",
                        as: "product"
                    }
                }
                ,
                {
                    $project: {
                        item: 1,
                        Qty: 1,
                        product: {
                            $arrayElemAt: ["$product", 0]
                        }
                    }
                }
            ]).toArray()
            console.log(wishlist);
            resolve(wishlist)
        })
    },
    removeWish: (wishId, proId) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collections.WISHLIST_COLLECTION).updateOne({ _id: objectId(wishId), "products.item": objectId(proId) },
                {
                    $pull: {
                        'products': {
                            "item": objectId(proId)
                        }
                    }
                }).then(() => {
                    resolve({ removeProduct: true })
                })
        })
    },
    productMen: () => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collections.PRODUCTS_COLLECTION).find({ $and: [{ category: "MEN" }, { isAvailable: true }] }).toArray()
            resolve(products)
        })
    },
    productWomen: () => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collections.PRODUCTS_COLLECTION).find({ $and: [{ category: "WOMEN" }, { isAvailable: true }] }).toArray()
            resolve(products)
        })
    },
    productAccess: () => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collections.PRODUCTS_COLLECTION).find({ $and: [{ category: "ACCESSORIES" }, { isAvailable: true }] }).toArray()
            resolve(products)
        })
    },
    refundOrder: (orderId, proId, total, data) => {
        let newTotal = parseInt(total)
        return new Promise(async (resolve, reject) => {
            db.get().collection(collections.ORDER_COLLECTION)
                .updateOne({ _id: objectId(orderId), "products.item": objectId(proId) }, {
                    $set: {
                        "products.$.cancelrequest": true
                    }
                }).then(() => {
                    db.get().collection(collections.USERS_COLLECTIONS).updateOne({ _id: objectId(data._id) }, { $inc: { walletbalance: newTotal } }).then(() => {
                        db.get().collection(collections.USERS_COLLECTIONS).updateOne({ _id: objectId(data._id) }, {
                            $push: {
                                "wallethistory": {
                                    from: "refund",
                                    amount: newTotal
                                }
                            }
                        })
                    })
                    resolve()
                })
        })
    },
    getWalletHistory: (userId) => {
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collections.USERS_COLLECTIONS).findOne({ _id: objectId(userId) })
            resolve(user)
        })
    },
    emptyCart: (userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.CARTS_COLLECTION).deleteOne({ user: objectId(userId) })
            resolve()
        })
    }
}