#!/usr/bin/env node

const axios = require('axios');
const cheerio = require('cheerio');

const searchPhones = async (searchQuery) => {
  try {
    const searchUrl = `https://m.gsmarena.com/results.php3?sQuickSearch=yes&sName=${encodeURIComponent(searchQuery)}`;
    const response = await axios.get(searchUrl, {
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
        'sec-ch-ua': '"Chromium";v="107", "Not=A?Brand";v="24"',
        'sec-ch-ua-mobile': '?1',
        'sec-ch-ua-platform': '"Windows"'
      }
    });

    const $ = cheerio.load(response.data);
    
    const phones = [];
    $('.general-menu ul li').each((i, el) => {
      const $link = $(el).find('a');
      const href = $link.attr('href');
      const name = $link.find('strong').text().trim().replace(/\n/g, ' ');
      const img = $link.find('img').attr('src');
      
      if (href && name) {
        phones.push({
          name: name,
          url: href,
          image: img
        });
      }
    });
    
    if (phones.length === 0) {
      return {
        success: false,
        message: 'No results found!'
      };
    }
    
    return {
      success: true,
      results: phones
    };
    
  } catch (error) {
    return {
      success: false,
      message: `Failed to search: ${error.message}`
    };
  }
};

const getFirstUrl = async (searchQuery) => {
  try {
    const searchUrl = `https://m.gsmarena.com/results.php3?sQuickSearch=yes&sName=${encodeURIComponent(searchQuery)}`;
    const response = await axios.get(searchUrl, {
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
        'sec-ch-ua': '"Chromium";v="107", "Not=A?Brand";v="24"',
        'sec-ch-ua-mobile': '?1',
        'sec-ch-ua-platform': '"Windows"'
      }
    });

    const $ = cheerio.load(response.data);
    
    const firstLink = $('.general-menu ul li').first().find('a').attr('href');
    if (firstLink) {
      return firstLink;
    }
    
    return null;
  } catch (error) {
    throw new Error(`Failed to get first URL: ${error.message}`);
  }
};

const getPhoneSpecs = async (searchQuery, isDirectUrl = false) => {
  try {
    let phoneUrl;
    
    if (isDirectUrl) {
      phoneUrl = `https://m.gsmarena.com/${searchQuery}`;
    } else {
      const firstResult = await getFirstUrl(searchQuery);
      
      if (!firstResult) {
        return {
          success: false,
          message: 'No results found!'
        };
      }
      
      phoneUrl = `https://m.gsmarena.com/${firstResult}`;
    }
    
    const response = await axios.get(phoneUrl, {
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
        'sec-ch-ua': '"Chromium";v="107", "Not=A?Brand";v="24"',
        'sec-ch-ua-mobile': '?1',
        'sec-ch-ua-platform': '"Windows"'
      }
    });

    const $ = cheerio.load(response.data);
    const name = $('h1.section.nobor').text().trim();
    const image = $('img[alt*="MORE PICTURES"]').attr('src');
    const specs = {};
    
    $('#specs-list table').each((i, table) => {
      const category = $(table).find('th').first().text().trim();
      const categorySpecs = {};
      
      $(table).find('tr').not(':first').each((j, row) => {
        const label = $(row).find('td.ttl').text().trim();
        const value = $(row).find('td.nfo').text().trim();
        
        if (label && value && !$(row).hasClass('tr-toggle')) {
          categorySpecs[label] = value;
        }
      });
      
      if (Object.keys(categorySpecs).length > 0 && category) {
        specs[category] = categorySpecs;
      }
    });

    const quickSpecs = {
      display: $('[data-spec="displaysize-hl"]').text() + '" ' + $('[data-spec="displayres-hl"]').text(),
      camera: $('[data-spec="camerapixels-hl"]').text() + 'MP',
      video: $('[data-spec="videopixels-hl"]').text(),
      ram: $('[data-spec="ramsize-hl"]').text() + 'GB RAM',
      chipset: $('[data-spec="chipset-hl"]').text(),
      battery: $('[data-spec="batsize-hl"]').text() + 'mAh',
      charging: $('[data-spec="battype-hl"]').text().trim(),
      released: $('[data-spec="released-hl"]').text(),
      body: $('[data-spec="body-hl"]').text(),
      os: $('[data-spec="os-hl"]').text(),
      storage: $('[data-spec="storage-hl"]').text()
    };

    return {
      success: true,
      url: phoneUrl,
      
      data: {
        name,
        image,
        quickSpecs,
        detailedSpecs: specs
      }
    };

  } catch (error) {
    return {
      success: false,
      message: `Failed to fetch phone specs: ${error.message}`
    };
  }
};

module.exports = {
    searchPhones,
    getPhoneSpecs
};
