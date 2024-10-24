// Gerekli kütüphaneleri yüklüyoruz.
var express = require('express')
var router = express.Router(); // Express Router'ı başlatıyoruz, bu API endpoint'lerini yönetmek için kullanılır.
// audit logs ekleniyo
const AuditLogs=require("../lib/AuditLogs");
// MongoDB Categories modelini yüklüyoruz.
const Categories = require("../db/models/Categories");

// API yanıtlarını yapılandırmak için bir yardımcı sınıf yüklüyoruz.
const Response = require("../lib/Response")

// HTTP durum kodları gibi sabitleri içeren Enum dosyasını yüklüyoruz.
const Enum = require("../config/Enum");

// Hata yönetimi için özel hata sınıflarını yüklüyoruz.
const Error = require("../lib/Error");
const CustomError = require('../lib/Error');
const logger=require ("../lib/logger/LoggerClass");

// Kullanıcı oturumunu doğrulamak için bir kontrol (şu an hardcoded olarak true yani doğrulama başarılı).
const isAuthhenticated = true;

// Tüm istekler için (POST, GET vb.) oturum kontrolü yapılıyor.
router.all("*", (req, res, next) => {
    if (isAuthhenticated) {
        // Eğer kullanıcı doğrulanmışsa, bir sonraki middleware'e geç.
        next();
    } else {
        // Eğer kullanıcı doğrulanmamışsa, hata mesajı döndür.
        res.json({ success: false, error: "not authenticated" });
    }
})

// GET /categories/ isteğiyle tüm kategorileri listeler.
router.get('/', async (req, res, next) => {
    try {
        // MongoDB'den tüm kategorileri alıyoruz.
        let categories = await Categories.find({});
        
        // Başarılı yanıt dönüyoruz. (Response.successResponse ile)
        res.json(Response.successResponse(categories))
    } catch (error) {
        // Eğer hata varsa, hata yanıtını oluşturuyoruz.
        let errorResponse = Response.errorResponse(error);
        
        // Hata kodu ve mesajını dönüyoruz.
        res.status(errorResponse.code).json(errorResponse);
    }
});

// POST /categories/add ile yeni bir kategori ekler.
router.post("/add", async (req, res) => {
    let body = req.body; // Gövdeyi (body) alıyoruz.

    try {
        // Eğer 'name' alanı yoksa, özel hata fırlatıyoruz.
        if (!body.name) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Validation Error")

        // Yeni kategori oluşturuyoruz.
        let category = new Categories({
            name: body.name,
            is_active: true, // Varsayılan olarak aktif yapıyoruz.
            created_by: req.user?.id // Ekleyen kullanıcı (gerçek uygulamada kimlik doğrulama yapılmalıdır).
        });

        // Yeni kategoriyi kaydediyoruz.
        await category.save();
        AuditLogs.info(req.user?.email,"Categories","Add",category);
logger.info(req.user?.email,"Categories","Add",category);
        // Başarılı yanıt döndürülüyor.
        res.json(Response.successResponse({ success: true }))
    } catch (err) {
        logger.error(req.user?.email,"Categories","Add",err);
        // Hata oluşursa, hata yanıtı oluşturup dönüyoruz.
        let errorResponse = Response.errorResponse(err);
        res.status(errorResponse.code).json(errorResponse);
    }
});

// POST /categories/update ile mevcut bir kategoriyi günceller.
router.post("/update", async (req, res) => {
    let body = req.body; // Gövdeyi alıyoruz.
    try {
        // Eğer '_id' alanı yoksa, özel hata fırlatıyoruz.
        if (!body._id) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Validation Error", "_id field must be filled")
        
        // Güncellenecek alanlar belirleniyor.
        let updates = {};

        // Eğer 'name' alanı doluysa, bu alanı güncelleme nesnesine ekliyoruz.
        if (body.name) updates.name = body.name;

        // Eğer 'is_active' alanı boolean tipindeyse, bu alanı güncelleme nesnesine ekliyoruz.
        if (typeof body.is_active === "boolean") updates.is_active = body.is_active

        // Belirtilen kategoriyi güncelliyoruz.
        await Categories.updateOne({ _id: body._id }, updates);
        AuditLogs.info(req.user?.email,"Categories","Update",{_id: body.id,...updates});

        // Başarılı yanıt döndürülüyor.
        res.json(Response.successResponse({ success: true }))
    } catch (err) {
        // Hata oluşursa, hata yanıtı oluşturulup döndürülüyor.
        let errorResponse = Response.errorResponse(err);
        res.status(errorResponse.code).json(errorResponse);
    }
})

// POST /categories/delete ile mevcut bir kategoriyi siler.
router.post("/delete", async (req, res) => {
    let body = req.body; // Gövdeyi alıyoruz.
    try {
        // Eğer '_id' alanı yoksa, özel hata fırlatıyoruz.
        if (!body._id) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Validation Error");
        
        // Belirtilen kategoriyi siliyoruz.
        await Categories.remove({ _id: body._id });
        AuditLogs.info(req.user?.email,"Categories","Delete",{_id: body.id});

        // Başarılı yanıt döndürülüyor.
        res.json(Response.successResponse({ success: true }));
    } catch (error) {
        // Hata oluşursa, hata yanıtı oluşturulup döndürülüyor.
        let errorResponse = Response.errorResponse(error);
        res.status(errorResponse.code).json(errorResponse);
    }
})

// Bu router dışa aktarılıyor, böylece app.js veya ana dosyada kullanılabilir.
module.exports = router;
