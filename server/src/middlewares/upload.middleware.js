import multer from "multer";

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      const error = new Error("Only PDF files are allowed");
      error.statusCode = 400;
      return cb(error);
    }

    cb(null, true);
  },
});

export default upload;