// Mongoose kütüphanesini require ile içe aktarıyoruz. Bu, MongoDB ile çalışmamıza olanak sağlar.
const mongoose = require("mongoose");

// Mongoose'dan bir Schema nesnesi oluşturuyoruz. Bu nesne, MongoDB'deki "users" koleksiyonunun yapısını belirleyecek.
const schema = mongoose.Schema(
    {
        // Kullanıcının email adresi. Tipi String olarak belirlenmiş.
        email: {type: String,required: true,unique: true},

        // Kullanıcının şifresi. Tipi String olarak belirlenmiş.
        password: {type: String,required: true},

        // Kullanıcının aktif olup olmadığını belirten boolean değeri. Tipi Boolean.
        is_active: {type: Boolean,required: true},

        // Kullanıcının ilk adı. Tipi String.
        first_name: String,

        // Kullanıcının soyadı. Tipi String.
        last_name: String,

        // Kullanıcının telefon numarası. Tipi String.
        phone_number: String
    },
    {
        versionKey:false,// otomatik olarak gelen version key değerinin gelmesini istemiyorum.
        // Bu ikinci parametre, zaman damgalarını otomatik olarak eklemek için kullanılır.
        // createdAt ve updatedAt isimleriyle tarih ve zaman değerleri otomatik olarak kaydedilecek.
        timestamps: {
            createdAt: "created_at",  // Belgenin ilk oluşturulduğu zaman.
            updatedAt: "updated_at"   // Belgenin en son güncellendiği zaman.
        }
    }
);

// Mongoose.Model sınıfını genişleten Users adında bir sınıf oluşturuyoruz. Bu sınıfla daha fazla işlev ekleyebilirsin.
class Users extends mongoose.Model {
    // Bu sınıf ileride ek işlevler için kullanılabilir. Şu an boş.
}

// Schema'ya Users sınıfını yüklüyoruz, böylece Mongoose bu sınıfı modelle bağlayacak.
schema.loadClass(Users);

// Son olarak, oluşturulan schema'ya dayanarak "users" adında bir model oluşturuyoruz
// ve bu modeli dışa aktarıyoruz. Bu model veritabanı ile CRUD işlemleri yapmak için kullanılacak.
module.exports = mongoose.model("users", schema);
