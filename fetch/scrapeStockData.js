const axios  = require("axios");
const  Cheerio  = require("cheerio");

const scrapeStockData = async () => {
  try {
    const url = "https://finans.mynet.com/borsa/hisseler/";
    const { data } = await axios.get(url);
    const $ = Cheerio.load(data);
    const stockData = [];

    $("table.table-data tbody tr").each((index, element) => {
      const stockName = $(element).find("td:first-child strong").text().trim();
      const lastPrice = $(element).find("td").eq(2).text().trim();
      const changePercent = $(element).find("td").eq(3).text().trim();

      stockData.push({
        stockName,
        lastPrice,
        changePercent,
      });
    });

    return stockData;
  } catch (error) {
    console.error(error);
    return [];
  }
};

module.exports = scrapeStockData;
