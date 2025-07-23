const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:5500', 'http://127.0.0.1:5500'] // Allow both origins
}));
app.use(express.json());

// MongoDB Connection
const MONGODB_URI = 'mongodb+srv://sat:B6FlgXIdMFcCBwQu@cluster0.kohef.mongodb.net/sat?retryWrites=true&w=majority';
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// Schemas and Models
const testSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  phone: { type: String, unique: true },
  answers: Object,
  score: Number,
  createdAt: { type: Date, default: Date.now }
});
const Test = mongoose.model('Test', testSchema);

const questionSchema = new mongoose.Schema({
  question: String,
  options: [String],
  correctAnswer: String,
  createdAt: { type: Date, default: Date.now }
});
const Question = mongoose.model('Question', questionSchema);

const courseSchema = new mongoose.Schema({
  courseName: { type: String, unique: true },
  fee: Number,
  createdAt: { type: Date, default: Date.now }
});
const Course = mongoose.model('Course', courseSchema);

const discountSchema = new mongoose.Schema({
  minScore: { type: Number, required: true },
  maxScore: { type: Number, required: true },
  discountPercentage: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});
const Discount = mongoose.model('Discount', discountSchema);

// Routes
app.post('/courses', async (req, res) => {
  console.log('POST /courses called at:', new Date().toISOString(), 'with:', req.body);
  try {
    const { courseName, fee } = req.body;
    const newCourse = new Course({ courseName, fee });
    await newCourse.save();
    res.status(201).json(newCourse);
  } catch (err) {
    console.error('Error in /courses:', err);
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Course name already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

app.get('/courses', async (req, res) => {
  console.log('GET /courses called at:', new Date().toISOString());
  try {
    const courses = await Course.find();
    console.log('Courses fetched:', courses);
    res.json(courses);
  } catch (err) {
    console.error('Error in GET /courses:', err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/courses/:id', async (req, res) => {
  console.log(`PUT /courses/${req.params.id} called at:`, new Date().toISOString(), 'with:', req.body);
  try {
    const { courseName, fee } = req.body;
    const updated = await Course.findByIdAndUpdate(
      req.params.id,
      { courseName, fee },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Course not found' });
    res.json(updated);
  } catch (err) {
    console.error('Error in PUT /courses:', err);
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Course name already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

app.delete('/courses/:id', async (req, res) => {
  console.log(`DELETE /courses/${req.params.id} called at:`, new Date().toISOString());
  try {
    const deleted = await Course.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Course not found' });
    res.json({ message: 'Course deleted' });
  } catch (err) {
    console.error('Error in DELETE /courses:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/discounts', async (req, res) => {
  console.log('POST /discounts called at:', new Date().toISOString(), 'with:', req.body);
  try {
    const { minScore, maxScore, discountPercentage } = req.body;
    if (minScore > maxScore) {
      return res.status(400).json({ error: 'Min score cannot be greater than max score' });
    }
    const newDiscount = new Discount({ minScore, maxScore, discountPercentage });
    await newDiscount.save();
    res.status(201).json(newDiscount);
  } catch (err) {
    console.error('Error in /discounts:', err);
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Discount with these score ranges already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

app.get('/discounts', async (req, res) => {
  console.log('GET /discounts called at:', new Date().toISOString());
  try {
    const discounts = await Discount.find().sort({ minScore: 1 });
    console.log('Discounts fetched:', discounts);
    res.json(discounts);
  } catch (err) {
    console.error('Error in GET /discounts:', err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/discounts/:id', async (req, res) => {
  console.log(`PUT /discounts/${req.params.id} called at:`, new Date().toISOString(), 'with:', req.body);
  try {
    const { minScore, maxScore, discountPercentage } = req.body;
    if (minScore > maxScore) {
      return res.status(400).json({ error: 'Min score cannot be greater than max score' });
    }
    const updated = await Discount.findByIdAndUpdate(
      req.params.id,
      { minScore, maxScore, discountPercentage },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Discount not found' });
    res.json(updated);
  } catch (err) {
    console.error('Error in PUT /discounts:', err);
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Discount with these score ranges already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

app.delete('/discounts/:id', async (req, res) => {
  console.log(`DELETE /discounts/${req.params.id} called at:`, new Date().toISOString());
  try {
    const deleted = await Discount.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Discount not found' });
    res.json({ message: 'Discount deleted' });
  } catch (err) {
    console.error('Error in DELETE /discounts:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/submit-test', async (req, res) => {
  console.log('POST /submit-test called at:', new Date().toISOString(), 'with:', req.body);
  try {
    const { email, phone, answers } = req.body;

    const existing = await Test.findOne({ $or: [{ email }, { phone }] });
    if (existing) {
      return res.status(400).json({ error: 'You have already submitted the test.' });
    }

    const questions = await Question.find();
    let score = 0;

    questions.forEach(q => {
      const qid = q._id.toString();
      const userAnswer = answers[qid]?.trim().toLowerCase();
      const correctAnswer = q.correctAnswer?.trim().toLowerCase();
      if (userAnswer && userAnswer === correctAnswer) {
        score++;
      }
    });

    const totalQuestions = questions.length;
    const percentage = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0;

    const discounts = await Discount.find().sort({ minScore: 1 });
    let discountPercentage = 0;
    for (const discount of discounts) {
      if (percentage >= discount.minScore && percentage <= discount.maxScore) {
        discountPercentage = discount.discountPercentage;
        break;
      }
    }

    const testResult = new Test({ email, phone, answers, score });
    await testResult.save();

    const courses = await Course.find();
    const responseCourses = courses.map(c => ({
      course: c.courseName,
      originalFee: c.fee,
      discount: `${discountPercentage}%`,
      discountedFee: c.fee * (1 - discountPercentage / 100)
    }));

    res.json({ score, percentage: percentage.toFixed(2), courses: responseCourses });
  } catch (err) {
    console.error('Error submitting test:', err);
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Email or phone number already used for a test submission' });
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/questions', async (req, res) => {
  console.log('POST /questions called at:', new Date().toISOString(), 'with:', req.body);
  try {
    const { question, options, correctAnswer } = req.body;
    if (!question || !options || options.length === 0 || !correctAnswer) {
      return res.status(400).json({ error: 'Question, options, and correct answer are required' });
    }
    if (!options.includes(correctAnswer)) {
      return res.status(400).json({ error: 'Correct answer must be one of the provided options' });
    }
    const newQuestion = new Question({ question, options, correctAnswer });
    await newQuestion.save();
    res.status(201).json(newQuestion);
  } catch (err) {
    console.error('Error in /questions:', err);
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Question already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

app.get('/questions', async (req, res) => {
  console.log('GET /questions called at:', new Date().toISOString());
  try {
    const questions = await Question.find();
    console.log('Questions fetched:', questions);
    res.json(questions);
  } catch (err) {
    console.error('Error in GET /questions:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/questions/:id', async (req, res) => {
  console.log(`GET /questions/${req.params.id} called at:`, new Date().toISOString());
  try {
    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ error: 'Question not found' });
    res.json(question);
  } catch (err) {
    console.error('Error in GET /questions/:id:', err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/questions/:id', async (req, res) => {
  console.log(`PUT /questions/${req.params.id} called at:`, new Date().toISOString(), 'with:', req.body);
  try {
    const { question, options, correctAnswer } = req.body;
    if (!question || !options || options.length === 0 || !correctAnswer) {
      return res.status(400).json({ error: 'Question, options, and correct answer are required' });
    }
    if (!options.includes(correctAnswer)) {
      return res.status(400).json({ error: 'Correct answer must be one of the provided options' });
    }
    const updated = await Question.findByIdAndUpdate(
      req.params.id,
      { question, options, correctAnswer },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Question not found' });
    res.json(updated);
  } catch (err) {
    console.error('Error in PUT /questions:', err);
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Question already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

app.delete('/questions/:id', async (req, res) => {
  console.log(`DELETE /questions/${req.params.id} called at:`, new Date().toISOString());
  try {
    const deleted = await Question.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Question not found' });
    res.json({ message: 'Question deleted' });
  } catch (err) {
    console.error('Error in DELETE /questions:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/tests', async (req, res) => {
  console.log('GET /tests called at:', new Date().toISOString());
  try {
    const tests = await Test.find().sort({ createdAt: -1 });
    console.log('Tests fetched:', tests);
    res.json(tests);
  } catch (err) {
    console.error('Error fetching tests:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Error-handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Catch-all route for undefined endpoints
app.use((req, res) => {
  console.log(`Catch-all route hit for ${req.method} ${req.url} at:`, new Date().toISOString());
  res.status(404).json({ error: 'Route not found' });
});

// Start Server
const PORT = process.env.PORT || 5000;
console.log('Server starting...');
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});