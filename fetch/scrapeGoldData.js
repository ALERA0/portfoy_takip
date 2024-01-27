const axios = require("axios");
const cheerio = require("cheerio");

const scrapeGoldData = async () => {
  try {
    const url = "https://bigpara.hurriyet.com.tr/altin/";
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const goldData = [];

    $(".tBody ul").each((index, element) => {
      const name = $(element).find("li.cell010 h3 a").text().trim() ||$(element).find("li.cell010 b").text().trim() ;
      const lastPrice = $(element).find("li.cell009").first().text().trim();
      const changePercent = $(element).find("li.cell009").eq(2).text().trim();

      goldData.push({
        name,
        lastPrice,
        changePercent
      });
    });

    return goldData;
  } catch (error) {
    console.error(error);
    return [];
  }
};

module.exports = scrapeGoldData;
