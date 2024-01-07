const axios = require("axios");
const cheerio = require("cheerio");

const scrapeCurrencyData = async () => {
  try {
    const url = "https://kur.doviz.com/";
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const currencyData = [];

    $("tbody tr").each((index, element) => {
      const currencyName = $(element).find("td:first-child div.currency-details div").first().text().trim();
      const currencyDesc = $(element).find("td:first-child div.currency-details .cname").text().trim();
      const lastPrice = $(element).find("td").eq(1).text().trim();
      const changePercent = $(element).find("td").eq(5).text().trim();

      currencyData.push({
        currencyName,
        currencyDesc,
        lastPrice,
        changePercent,
      });
    });

    return currencyData;
  } catch (error) {
    console.error(error);
    return [];
  }
};

module.exports = scrapeCurrencyData;
