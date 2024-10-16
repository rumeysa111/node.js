// Gerekli dosyalar ve sınıflar içe aktarılıyor.
// Enum, HTTP durum kodlarını ve diğer sabit değerleri içeren bir yapı olabilir.
// CustomError, özel hata sınıfı.
const Enum = require("../config/Enum");
const CustomError = require("./Error");

// Response sınıfı, API'den döndürülecek başarılı ve hatalı yanıtları yapılandırmak için kullanılır.
class Response {

    // Constructor tanımlı ama herhangi bir işlevi yok.
    // Gerek olmadığı için boş bırakılmış.
    constructor() {}

    // Başarılı bir yanıt oluşturmak için kullanılan statik metot.
    // 'code' (HTTP durum kodu) ve 'data' (API'nin döndüreceği veri) alır.
    static successResponse(data, code = 200) {
        // Başarılı yanıt objesi oluşturuluyor ve döndürülüyor.
        return {
            code, // HTTP durum kodunu yanıtın 'code' kısmına ekler.
            data  // API'den dönen veriyi yanıtın 'data' kısmına ekler.
        };
    }

    // Hatalı bir yanıt oluşturmak için kullanılan statik metot.
    // 'error' nesnesini parametre olarak alır ve hata mesajını döner.
    static errorResponse(error) {
        console.error(error)
        // Eğer hata nesnesi CustomError sınıfına aitse, özel hata formatı döndürülür.
        if (error instanceof CustomError) {
            return {
                code: error.code, // CustomError'dan gelen hata kodu.
                error: {
                    message: error.message,       // CustomError'dan gelen hata mesajı.
                    description: error.description // CustomError'dan gelen açıklama.
                }
            };
        }

        // Eğer hata CustomError değilse, genel bir hata mesajı döndürülür.
        return {
            code: Enum.HTTP_CODES.INT_SERVER_ERROR, // Sabitlenmiş bir "internal server error" kodu.
            error: {
                message: "Unknown Error!",          // Genel hata mesajı.
                description: error.message          // Hatanın açıklaması.
            }
        };
    }
}

// Bu sınıf dışa aktarılıyor, böylece diğer dosyalarda kullanılabilir.
module.exports = Response;
