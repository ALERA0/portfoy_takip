const axios = require("axios");
const cheerio = require("cheerio");

const scrapeCurrencyData = async () => {
  try {
    const url = "https://kur.doviz.com/";
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const currencyData = [];

    $("tbody tr").each((index, element) => {
      const currencyDetails = $(element).find("td:first-child div.currency-details");
      const isCryptocurrencyRow = $(element).find("a.item[data-ga-event-param1-value='market_summary_items']").length > 0;

      if (currencyDetails.length > 0 && !isCryptocurrencyRow) {
        const name = currencyDetails.find("div").first().text().trim();
        const desc = currencyDetails.find(".cname").text().trim();
        const lastPrice = $(element).find("td").eq(1).text().trim();
        const changePercent = $(element).find("td").eq(5).text().trim();

        currencyData.push({
          name,
          desc,
          lastPrice,
          changePercent,
        });
      }
    });

    return currencyData;
  } catch (error) {
    console.error(error);
    return [];
  }
};

module.exports = scrapeCurrencyData;
