const fs = require('fs');
const path = require('path');

const uploadDir = path.join(__dirname, 'data', 'uploads');
const dirs = ['_chung/quy-trinh', '_chung/bao-gia', 'bv-bach-mai/hop-dong', 'bv-viet-duc/bien-ban'];

dirs.forEach(dir => {
  const fullPath = path.join(uploadDir, dir);
  fs.mkdirSync(fullPath, { recursive: true });
});

fs.writeFileSync(path.join(uploadDir, '_chung/quy-trinh/quy-trinh_bao-tri-dinh-ky_v2.pdf'), 'Mock PDF Content');
fs.writeFileSync(path.join(uploadDir, 'bv-bach-mai/hop-dong/hop-dong_may-xray-dr800_bach-mai_2026.pdf'), 'Mock PDF Content 2');
fs.writeFileSync(path.join(uploadDir, 'bv-viet-duc/bien-ban/bien-ban_ban-giao-may-noi-soi_viet-duc_2026.pdf'), 'Mock PDF Content 3');

console.log("Mock data created!");
