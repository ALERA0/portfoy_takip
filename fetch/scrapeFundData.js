
const axios = require("axios");
const cheerio = require("cheerio");
const fundNames = require("../shared/fund");

const formatLastPrice = (rawLastPrice) => {
    const parts = rawLastPrice.split(',');
    const integerPart = parts[0].trim();
    const decimalPart = parts[1] ? parts[1].trim().slice(0, 4) : ''; 
    return `${integerPart}.${decimalPart}`;
  };

const scrapeFundData = async () => {
    const fundData = [];
  
    for (const fundName of fundNames) {
      try {
        const url = `https://www.tefas.gov.tr/FonAnaliz.aspx?FonKod=${fundName}`;
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
  
        const desc = $("#MainContent_FormViewMainIndicators_LabelFund").text().trim();
        const rawLastPrice = $(".top-list li:contains('Son Fiyat') span").text().trim();
        const lastPrice = formatLastPrice(rawLastPrice);
        const changePercent = $(".top-list li:contains('Günlük Getiri') span").text().trim().replace('%', '');
  
        fundData.push({
          name: fundName,
          desc,
          lastPrice,
          changePercent,
        });
  
      } catch (error) {
        console.error(`Error scraping data for fund ${fundName}: ${error.message}`);
      }
    }
  
    return fundData;
  };
  
  module.exports = scrapeFundData;