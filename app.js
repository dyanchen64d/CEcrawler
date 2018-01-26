const express = require('express')
const app = express()
const superagent = require('superagent')
const cheerio = require('cheerio')
const fs = require('fs')

function getCEdataAndWriteFile () {
  superagent
    .get('http://fate-go.cirnopedia.org/craft_essence.php')
    // http://fate-go.cirnopedia.org/craft_essence.php
    // http://fgowiki.com/equipguide
    // http://api.umowang.com/guides/data/fgo?jsoncallback=getguidedata&command=equip_list_all&page=2&params=
    .then((res) => {
      let _text = res.text
      let $ = cheerio.load(_text)
      let list = []

      $('#rounded-corner>tbody>tr').filter((i, el) => {
          return $(el).attr('id')
      }).each((idx, elem) => {
        // if (idx !== 212) return;
        let $elem = $(elem)

        // 礼装 name
        let name = $elem.children().eq(3).text()
        let name_jp = $elem.children().eq(3).find('font').text()
        let name_en = name.substr(name_jp.length)

        // 礼装 desc
        let descs = $elem.children('.desc').last().children('.tab-blue')
        let no, rarity, cost, hp, maxhp, atk, maxatk, effect, maxlimit, details = ''
        // console.log(descs);

        descs.each(function (tabidx, tab) {
          let $tab = $(tab)

          switch ($tab.text()) {
            case 'No.':
              no = $tab[0].next.data.trim()
              break;
            case 'Rarity':
              rarity = $tab.next().text().trim()
              break;
            case 'Cost':
              cost = $tab[0].next.data.trim()
              break;
            case 'HP':
              hp = $tab[0].next.data.trim()
              break;
            case 'Max HP':
              maxhp = $tab[0].next.data.trim()
              break;
            case 'ATK':
              atk = $tab[0].next.data.trim()
              break;
            case 'Max ATK':
              maxatk = $tab[0].next.data.trim()
              break;
            case 'Skill':
              effect = $tab.next().html().replace(/\<br\>/g, '\n').trim()
              break;
            case 'Max Limit':
              maxlimit = $tab.next().children('font').html().replace(/\<br\>/g, '\n').trim()
              break;
            case 'Details':
              details = $tab.next().text().trim()
              break;
            default:
          }
        })

        // 礼装 image
        let image = $elem.children().eq(2).find('img')
        let src = image.attr('style').split(', ')[2].split('\'')[1].split('/')[2]
        // console.log(src);

        list.push({
          name_en,
          name_jp,
          no,
          rarity,
          cost,
          hp,
          maxhp,
          atk,
          maxatk,
          effect,
          maxlimit,
          details,
          src: 'http://fate-go.cirnopedia.org/icons/essence_sample/' + src
        })
      })

      // 写入文件
      fs.writeFileSync('./assets/craft_essence.txt', JSON.stringify(list))
      console.log('writeFileSync done!');
    })
    .catch((err) => {
      console.log('superagent err', err);
    })
}

function readFileAndGetCEdata (req, res, next) {
  let cedata = fs.readFileSync('./assets/craft_essence.txt')
  req.cedata = JSON.parse(cedata)
  next()
}

getCEdataAndWriteFile()



app.use(readFileAndGetCEdata);
app.get('/', (req, res, next) => {
  res.send(req.cedata)
})


app.listen(3000, () => console.log('App listening on port 3000....'))
