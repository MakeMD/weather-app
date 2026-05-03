// Мапа ID міста → файл картинки.
// Якщо ID не знайдено в цій мапі — буде показано плейсхолдер (прапор країни).

// Дефолтна картинка для міст, яких немає у мапі.
export const defaultCityImage = require('../assets/cities/defaultcity.webp');
export const cityImages = {
  
  // ── Українські міста ──
  kyiv: require('../assets/cities/kyiv.webp'),
  kharkiv: require('../assets/cities/kharkiv.webp'),
  lviv: require('../assets/cities/lviv.webp'),
  odesa: require('../assets/cities/odesa.webp'),
  dnipro: require('../assets/cities/dnipro.webp'),
  zaporizhzha: require('../assets/cities/zaporizhzha.webp'),
  donetsk: require('../assets/cities/donetsk.webp'),
  luhansk: require('../assets/cities/luhansk.webp'),
  kherson: require('../assets/cities/kherson.webp'),
  mykolaiv: require('../assets/cities/mykolaiv.webp'),
  krimea: require('../assets/cities/krimea.webp'),
  cherkasy: require('../assets/cities/cherkasy.webp'),
  chernihiv: require('../assets/cities/chernihiv.webp'),
  chernivtsi: require('../assets/cities/chernivtsi.webp'),
  ivanofrankivsk: require('../assets/cities/ivanofrankivsk.webp'),
  khmelnytskyi: require('../assets/cities/khmelnytskyi.webp'),
  kropyvnytskyi: require('../assets/cities/kropyvnytskyi.webp'),
  lutsk: require('../assets/cities/lutsk.webp'),
  poltava: require('../assets/cities/poltava.webp'),
  rivne: require('../assets/cities/rivne.webp'),
  sumy: require('../assets/cities/sumy.webp'),
  ternopil: require('../assets/cities/ternopil.webp'),
  uzhhorod: require('../assets/cities/uzhhorod.webp'),
  vinnytsia: require('../assets/cities/vinnytsia.webp'),
  zhytomyr: require('../assets/cities/zhytomyr.webp'),

  // ── Європа ──
  warsaw: require('../assets/cities/warsaw.webp'),
  berlin: require('../assets/cities/berlin.webp'),
  prague: require('../assets/cities/prague.webp'),
  vienna: require('../assets/cities/vienna.webp'),
  paris: require('../assets/cities/paris.webp'),
  london: require('../assets/cities/london.webp'),
  rome: require('../assets/cities/rome.webp'),
  madrid: require('../assets/cities/madrid.webp'),
  amsterdam: require('../assets/cities/amsterdam.webp'),
  brussels: require('../assets/cities/brussels.webp'),
  budapest: require('../assets/cities/budapest.webp'),
  bucharest: require('../assets/cities/bucharest.webp'),
  bratislava: require('../assets/cities/bratislava.webp'),
  chisinau: require('../assets/cities/chisinau.webp'),
  lisbon: require('../assets/cities/lisbon.webp'),

  // ── Північна Америка ──
  new_york: require('../assets/cities/newyork.webp'),
  ottawa: require('../assets/cities/ottawa.webp'),

  // ── Азія ──
  tokyo: require('../assets/cities/tokyo.webp'),
  beijing: require('../assets/cities/beijing.webp'),
  seoul: require('../assets/cities/seoul.webp'),
  bangkok: require('../assets/cities/bangkok.webp'),
  new_delhi: require('../assets/cities/newdelhi.webp'),
  dubai: require('../assets/cities/dubai.webp'),

  // ── Близький Схід / Туреччина ──
  istanbul: require('../assets/cities/istanbul.webp'),
  ankara: require('../assets/cities/ankara.webp'),

  // ── Південна Європа / Середземномор'я ──
  athens: require('../assets/cities/athens.webp'),

  // ── Скандинавія ──
  helsinki: require('../assets/cities/helsinki.webp'),
  stockholm: require('../assets/cities/stockholm.webp'),
  oslo: require('../assets/cities/oslo.webp'),
  copenhagen: require('../assets/cities/copenhagen.webp'),

  // ── Британські острови ──
  dublin: require('../assets/cities/dublin.webp'),

  // ── Балтика ──
  tallinn: require('../assets/cities/tallinn.webp'),
  riga: require('../assets/cities/riga.webp'),
  vilnius: require('../assets/cities/vilnius.webp'),
};

// Розумний пошук картинки за різними варіантами id.
// Спершу пробує точний id, потім — без суфіксу країни.
// Повертає або require('...'), або null (тоді UI покаже плейсхолдер).
export const getCityImage = (city) => {
  if (!city) return defaultCityImage;

  // 1. Точний збіг (наприклад, kyiv → kyiv)
  if (cityImages[city.id]) {
    return cityImages[city.id];
  }

  // 2. Прибираємо суфікс координат (warsaw_pl_5223_2101 → warsaw_pl)
  const withoutCoords = city.id.replace(/(_-?\d+){2}$/, '');
  if (cityImages[withoutCoords]) {
    return cityImages[withoutCoords];
  }

  // 3. Без коду країни (warsaw_pl → warsaw)
  const withoutCountry = withoutCoords.replace(/_[a-z]{2}$/, '');
  if (withoutCountry !== withoutCoords && cityImages[withoutCountry]) {
    return cityImages[withoutCountry];
  }

  // 4. Фолбек на дефолтну картинку
  return defaultCityImage;
};