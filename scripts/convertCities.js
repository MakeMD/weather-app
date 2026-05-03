// scripts/convertCities.js
// Конвертує всі PNG з assets/cities_source/ → WebP в assets/cities/
// Запуск: node scripts/convertCities.js

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SOURCE_DIR = path.join(__dirname, '..', 'assets', 'cities_source');
const OUTPUT_DIR = path.join(__dirname, '..', 'assets', 'cities');

const TARGET_SIZE = 1080; // максимальний розмір сторони
const QUALITY = 85;       // 80-90 — золоте середнє для lossy WebP з прозорістю

async function convertAll() {
  // Перевірка наявності папок
  if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`❌ Не знайдено папку: ${SOURCE_DIR}`);
    return;
  }
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Знаходимо всі PNG-файли
  const files = fs
    .readdirSync(SOURCE_DIR)
    .filter((f) => f.toLowerCase().endsWith('.png'));

  if (files.length === 0) {
    console.warn('⚠️  Не знайдено жодного PNG в папці cities_source/');
    return;
  }

  console.log(`🔄 Знайдено ${files.length} PNG-файлів. Конвертуємо...\n`);

  let totalOriginal = 0;
  let totalConverted = 0;

  for (const file of files) {
    const inputPath = path.join(SOURCE_DIR, file);
    const outputName = file.replace(/\.png$/i, '.webp');
    const outputPath = path.join(OUTPUT_DIR, outputName);

    try {
      const originalSize = fs.statSync(inputPath).size;

      await sharp(inputPath)
        .resize(TARGET_SIZE, TARGET_SIZE, {
          fit: 'inside',           // вписуємо в TARGET_SIZE x TARGET_SIZE, не обрізаємо
          withoutEnlargement: true, // не збільшуємо, якщо оригінал менший
        })
        .webp({
          quality: QUALITY,
          alphaQuality: 90,        // прозорість стискаємо менш агресивно
          effort: 6,               // 0-6, 6 = найкраще стиснення (повільніше, але якісніше)
        })
        .toFile(outputPath);

      const convertedSize = fs.statSync(outputPath).size;
      totalOriginal += originalSize;
      totalConverted += convertedSize;

      const reduction = ((1 - convertedSize / originalSize) * 100).toFixed(0);
      const sizeKb = (convertedSize / 1024).toFixed(0);
      console.log(`✅ ${file} → ${outputName}  (${sizeKb} KB, -${reduction}%)`);
    } catch (err) {
      console.error(`❌ Помилка з ${file}:`, err.message);
    }
  }

  // Підсумок
  const totalOriginalMb = (totalOriginal / 1024 / 1024).toFixed(1);
  const totalConvertedMb = (totalConverted / 1024 / 1024).toFixed(1);
  const totalReduction = ((1 - totalConverted / totalOriginal) * 100).toFixed(0);

  console.log(`\n📊 Підсумок:`);
  console.log(`   Було:   ${totalOriginalMb} MB`);
  console.log(`   Стало:  ${totalConvertedMb} MB`);
  console.log(`   Економія: ${totalReduction}% 🎉`);
}

convertAll();