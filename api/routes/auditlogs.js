// Gerekli modülleri içe aktar (express, router, AuditLogs modeli ve moment)
const express = require("express"); 
const router = express.Router(); // Yeni bir router nesnesi oluştur
const AuditLogs = require("../db/models/AuditLogs"); // AuditLogs modelini veritabanından al
const moment = require("moment"); // Tarih ve saat işlemleri için moment modülünü al
const Response = require("../lib/Response");  // API yanıtlarını standartlaştırmak için kullanılıyor.

// POST isteği için bir rota oluştur
router.post("/", async (req, res) => {
  try {
    let body = req.body; // İstekle gelen veriyi body değişkenine al
    let query={};
    let skip=body.skip;
    let limit=body.limit;
    if(typeof body.skip !=="numeric"){
      skip=0;

    }if(typeof body.limit !=="numeric" || body.limit>500){
      limit=500;
    }

    // Eğer başlangıç ve bitiş tarihleri sağlanmışsa sorguya ekle
    if (body.begin_date && body.end_date) {
        query.created_at = { // created_at alanını verilen tarih aralığına göre sorgula
            $gte: body.begin_date, // begin_date'ye eşit veya daha büyük olan kayıtlar
            $lte: body.end_date,   // end_date'ye eşit veya daha küçük olan kayıtlar
        }
    } else { 
        // Eğer tarihler uygun formatta değilse, moment ile dönüştür ve sorguya ekle
        query.created_at = { 
            $gte: moment(body.begin_date), // Tarihi moment ile işleyerek büyük veya eşit olan kayıtlar
            $lte: moment(body.end_date)    // Küçük veya eşit olan kayıtlar
        }
    }

    // AuditLogs tablosundan/collection'ından verileri bul ve getir
    let auditLogs=await AuditLogs.find(query).sort({created_at:-1}).skip(skip).limit(limit);

    // Başarılı olursa JSON olarak başarılı yanıt döndür
    res.json(Response.successResponse(auditLogs));

  } catch (err) { 
    // Hata oluşursa hata yanıtı döndür
    let errorResponse = Response.errorResponse(err); 
    res.status(errorResponse.code).json(errorResponse); // Hatanın durum kodunu ve mesajını döndür
  }
});

// Bu router'ı diğer dosyalarda kullanılabilir hale getir
module.exports = router;
