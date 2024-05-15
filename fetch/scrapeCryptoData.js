const axios = require("axios");
const cheerio = require("cheerio");

const scrapeCryptoData = async () => {
    try {
        const cryptoData = [];
        const urls = [
            "https://cryptoslate.com/coins/?show=all",
            "https://cryptoslate.com/coins/page/2/?show=all",
            "https://cryptoslate.com/coins/page/3/?show=all",
            "https://cryptoslate.com/coins/page/4/?show=all",
            "https://cryptoslate.com/coins/page/5/?show=all"
        ];

        for (const url of urls) {
            const { data } = await axios.get(url);
            const $ = cheerio.load(data);

            $(".col.name").each((index, element) => {
                const desc = $(element).find("h3 a").text().trim().split(' ')[0];
                const name = $(element).find(".ticker").text().trim();
                const lastPrice = $(element).next().text().trim().replace(",","");
                const changePercent = $(element).next().next().text().trim().replace('%', '');

              

                cryptoData.push({
                    name,
                    desc,
                    lastPrice,
                    changePercent,
                });
            });
        }
        return cryptoData;
    } catch (error) {
        console.error(error);
        return [];
    }
};

module.exports = scrapeCryptoData;

  
  module.exports = scrapeCryptoData;
  