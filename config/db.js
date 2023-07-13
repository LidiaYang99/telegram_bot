const mongoose = require('mongoose');
// 因为机器人的情况，不需要太多的relacion, 只想简单记录用户和信息

mongoose.connect(process.env.MONGO_URL);