var express = require('express');
var router = express.Router();
const Response = require("../lib/Response");  // API yanıtlarını standartlaştırmak için kullanılıyor.
const Users = require("../db/models/Users");  // Kullanıcı modelini dahil eder.
const CustomError = require('../lib/Error');  // Hataları yönetmek için özel hata sınıfı.
const Enum = require('../config/Enum');  // Sabit değerleri içerir (örneğin, HTTP kodları, şifre uzunluğu).
const bcrypt = require("bcrypt-nodejs");  // Şifre hashleme işlemi için kullanılıyor.
const is = require("is_js");  // Email doğrulaması gibi çeşitli kontroller için kullanılır.
const Roles = require('../db/models/Roles');  // Rol modeli, kullanıcı rollerini yönetir.
const UserRoles = require('../db/models/UserRoles');  // Kullanıcı ve roller arasındaki ilişkileri yönetir.

// Kullanıcıları listeleme (GET /)
router.get('/', async (req, res, next) => {
  try {
    let users = await Users.find({});  // Tüm kullanıcıları MongoDB'den getirir.
    res.json(Response.successResponse(users));  // Başarılı bir yanıt döner.
  } catch (err) {
    let errorResponse = Response.errorResponse(err);  // Hata durumunda, hata yanıtı oluşturur.
    res.status(errorResponse.code).json(errorResponse);  // Hata yanıtını döner.
  }
});

// Yeni bir kullanıcı ekleme (POST /add)
router.post("/add", async (req, res) => {
  let body = req.body;
  try {
    // Email doğrulama
    if (!body.email) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "validation error", "email field must be an email format");
    if (is.not.email(body.email)) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "validation error", "Invalid email format");

    // Şifre doğrulama
    if (!body.password) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "validation error", "password field must be filled");
    if (body.password.length < Enum.PASS_LENGTH) {
      throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "validation error", "password length must be greater than minimum length");
    }

    // Roller doğrulama
    if (!body.roles || !Array.isArray(body.roles) || body.roles.length == 0) {
      throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "validation error", "roles field must be an array");
    }

    // Geçerli rollerin olup olmadığını kontrol et
    let roles = await Roles.find({ _id: { $in: body.roles } });
    if (roles.length == 0) {
      throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "validation error", "roles field must be valid roles");
    }

    // Şifreyi hashle
    let password = bcrypt.hashSync(body.password, bcrypt.genSaltSync(8), null);

    // Yeni kullanıcı oluştur
    let user = await Users.create({
      email: body.email,
      password,
      is_active: true,
      first_name: body.first_name,
      last_name: body.last_name,
      phone_number: body.phone_number,
    });

    // Kullanıcıya rollerini ekle
    for (let i = 0; i < roles.length; i++) {
      await UserRoles.create({
        role_id: roles[i]._id,
        user_id: user._id
      });
    }

    res.status(Enum.HTTP_CODES.CREATED).json(Response.successResponse({ success: true }, Enum.HTTP_CODES.CREATED));  // Başarı mesajı döner.
  } catch (err) {
    // Email zaten varsa (duplicate key hatası)
    if (err.code === 11000) {
      err = new CustomError(Enum.HTTP_CODES.CONFLICT, "Duplicate key error", "Email already exists");
    }
    let errorResponse = Response.errorResponse(err);
    res.status(errorResponse.code).json(errorResponse);
  }
});

// Kullanıcı güncelleme (POST /update)
router.post("/update", async (req, res) => {
  let body = req.body;
  let updates = {};

  try {
    // Güncelleme için kullanıcı ID'si gereklidir
    if (!body._id) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Validation Error", "_id field must be filled");

    // Şifre güncellenmek isteniyorsa hashlenir
    if (body.password && body.password.length >= Enum.PASS_LENGTH) {
      updates.password = bcrypt.hashSync(body.password, bcrypt.genSaltSync(8), null);
    }

    // Diğer alanlar güncellenir
    if (typeof body.is_active === "boolean") updates.is_active = body.is_active;
    if (body.first_name) updates.first_name = body.first_name;
    if (body.last_name) updates.last_name = body.last_name;
    if (body.phone_number) updates.phone_number = body.phone_number;

    // Rolleri güncelle
    if (Array.isArray(body.roles) && body.roles.length > 0) {
      let userRoles = await UserRoles.find({ user_id: body._id });
      let removedRoles = userRoles.filter(x => !body.roles.includes(x.role_id.toString()));
      let newRoles = body.roles.filter(x => !userRoles.map(r => r.role_id).includes(x));

      if (removedRoles.length > 0) {
        await UserRoles.deleteMany({ _id: { $in: removedRoles.map(x => x._id.toString()) } });
      }

      if (newRoles.length > 0) {
        for (let i = 0; i < newRoles.length; i++) {
          let userRole = new UserRoles({
            role_id: newRoles[i],
            user_id: body._id
          });
          await userRole.save();
        }
      }
    }

    await Users.updateOne({ _id: body._id }, updates);  // Kullanıcıyı güncelle
    res.json(Response.successResponse({ success: true }));

  } catch (err) {
    let errorResponse = Response.errorResponse(err);
    res.status(errorResponse.code).json(errorResponse);
  }
});

// İlk kullanıcıyı kayıt etme (POST /register)
router.post("/register", async (req, res) => {
  let body = req.body;
  try {
    // Zaten bir kullanıcı olup olmadığını kontrol eder
    let user = await Users.findOne({});
    if (user) {
      return res.sendStatus(Enum.HTTP_CODES.NOT_FOUND);  // Zaten kullanıcı varsa kayıt yapılmaz.
    }

    // Email doğrulama
    if (!body.email) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "validation error", "email field must be filled");
    if (is.not.email(body.email)) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "validation error", "Invalid email format");

    // Şifre doğrulama
    if (!body.password) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "validation error", "password field must be filled");
    if (body.password.length < Enum.PASS_LENGTH) {
      throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "validation error", "password length must be greater than 8");
    }

    // Şifreyi hashle
    let password = bcrypt.hashSync(body.password, bcrypt.genSaltSync(8), null);

    // Yeni kullanıcı oluştur
    let createdUser = await Users.create({
      email: body.email,
      password,
      is_active: true,
      first_name: body.first_name,
      last_name: body.last_name,
      phone_number: body.phone_number
    });

    // Yeni kullanıcıya süper admin rolü ekle
    let role = await Roles.create({
      role_name: Enum.SUPER_ADMIN,
      is_active: true,
      created_by: createdUser._id
    });

    await UserRoles.create({
      role_id: role._id,
      user_id: createdUser._id
    });

    res.json(Response.successResponse({ success: true }));

  } catch (error) {
    let errorResponse = Response.errorResponse(error);
    res.status(errorResponse.code).json(errorResponse);
  }
});

// Kullanıcı silme (POST /delete)
router.post("/delete", async (req, res) => {
  try {
    let body = req.body;

    // Kullanıcı ID'si kontrolü
    if (!body._id) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Validation Error", "_id field must be filled");

    await Users.deleteOne({ _id: body._id });  // Kullanıcıyı siler

    res.json(Response.successResponse({ success: true }));

  } catch (err) {
    let errorResponse = Response.errorResponse(err);
    res.status(errorResponse.code).json(errorResponse);
  }
});

module.exports = router;  // Bu dosyayı dışa aktararak diğer dosyalarda kullanılabilir hale getirir.
