const mongoose = require("mongoose");
const PortfolioDetail = require("./PortfolioDetail");

const portfolioSchema = new mongoose.Schema({
  name: {
    type: String,
    index: true,
  },
  portfolioDetails: [PortfolioDetail.schema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

portfolioSchema.pre("save", async function (next) {
  // PortfolioDetail içindeki her bir öğe için
  const detailsPromises = this.portfolioDetails.map(async (detail) => {
    // Eğer lastPrice boşsa ve type varsa
    if (!detail.lastPrice && detail.type) {
      // İlgili modeli bul ve eklenen verinin en son değerini al
      const model = mongoose.model(detail.type);
      const latestData = await model.findOne({ name: detail.name }).sort({ addedDate: -1 });

      // Eğer en son veri varsa, lastPrice'ı güncelle
      if (latestData) {
        detail.lastPrice = parseFloat(latestData.lastPrice);
      }
    }
  });

  // Tüm asenkron işlemleri bekleyerek devam et
  await Promise.all(detailsPromises);
  next();
});

module.exports = mongoose.model("Portfolio", portfolioSchema);
