const express = require('express')
const app = express()
const superagent = require('superagent')
const cheerio = require('cheerio')
const fs = require('fs')

function getCEdataAndWriteFile (req, res, next) {
  let _res = res
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
        let $elem = $(elem)

        // 礼装 name
        let name = $elem.children().eq(3).text()
        let name_jp = $elem.children().eq(3).find('font').text()
        let name_en = name.substr(name_jp.length)

        // 礼装 desc
        let desc = $elem.children('.desc').last()
        let no, rarity, cost, hp, maxhp, atk, maxatk, effect, maxlimit, details
        let html = desc.html()
        let htmlArr = html.split('<br>')

        htmlArr.forEach((htmlEl, htmlIdx) => {
          switch (htmlIdx) {
            // No
            case 0:
              no = htmlEl.split('</font> ')[1]
              // console.log(no);
              break;

            // Rarity
            case 1:
              rarity = $(htmlEl.split('</font> ')[1]).text()
              // console.log(rarity);
              break;

            // Cost
            case 2:
              cost = htmlEl.split('</font> ')[1]
              // console.log(cost);
              break;

            // hp maxhp
            case 3:
              let hpstr = htmlEl.split('</font> ')
              hp = hpstr[1].split(' <a>')[0]
              maxhp = hpstr[2]
              // console.log(hp, maxhp);
              break;

            // atk, maxatk
            case 4:
              let atkstr = htmlEl.split('</font> ')
              atk = atkstr[1].split(' <a>')[0]
              maxatk = atkstr[2]
              // console.log(atk, maxatk);
              break;

            // effect
            case 5:
              effect = $(htmlEl.split('</font> ')[1]).text()
              // console.log(effect);
              break;

            // maxlimit
            case 6:
              maxlimit = $(htmlEl.split('</font> ')[1]).text()
              // console.log(maxlimit);
              break;

            // details
            case 7:
              details = $(htmlEl.split('</font> ')[1]).text()
              // console.log(details);
              break;

            default:
              // console.log('switch default!');
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
      next()
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

app.use(readFileAndGetCEdata);

app.get('/', (req, res, next) => {
  res.send(req.cedata)
})


app.listen(3000, () => console.log('App listening on port 3000....'))
