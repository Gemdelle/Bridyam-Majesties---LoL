// LOCAL MODE: Questions loaded from local JSON

interface Category {
  id: number;
  name: string;
  description: string;
}

interface QuestionData {
  id: number;
  question: string;
  category_id: number;
  answers: string[];
  correct_answer_index: number;
}

interface Question {
  id: number;
  question: string;
  category: Category;
  answers: string[];
  correctAnswerIndex: number;
}

class QuestionsService {
  private questions: QuestionData[] | null = null;
  private categories: Category[] | null = null;

  private async loadData(): Promise<void> {
    if (this.questions && this.categories) return;

    const [questionsRes, categoriesRes] = await Promise.all([
      fetch('/data/questions.json'),
      fetch('/data/categories.json')
    ]);

    this.questions = await questionsRes.json();
    this.categories = await categoriesRes.json();
  }

  private formatQuestion(q: QuestionData): Question {
    const category = this.categories?.find(c => c.id === q.category_id) || {
      id: q.category_id,
      name: 'Unknown',
      description: ''
    };

    return {
      id: q.id,
      question: q.question,
      category,
      answers: q.answers,
      correctAnswerIndex: q.correct_answer_index
    };
  }

  async getRandomQuestion(): Promise<Question> {
    await this.loadData();
    
    if (!this.questions || this.questions.length === 0) {
      throw new Error('No questions available');
    }

    const randomIndex = Math.floor(Math.random() * this.questions.length);
    return this.formatQuestion(this.questions[randomIndex]);
  }

  async getQuestionByCategory(categoryId: number): Promise<Question> {
    await this.loadData();
    
    const categoryQuestions = this.questions?.filter(q => q.category_id === categoryId) || [];
    
    if (categoryQuestions.length === 0) {
      throw new Error(`No questions found for category ${categoryId}`);
    }

    const randomIndex = Math.floor(Math.random() * categoryQuestions.length);
    return this.formatQuestion(categoryQuestions[randomIndex]);
  }
}

const questionsService = new QuestionsService();
export { questionsService }; 