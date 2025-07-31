// API configuration
const API_BASE_URL = 'https://bridyam-majesties-back-production.up.railway.app';

interface Category {
  id: number;
  name: string;
  description: string;
}

interface Question {
  id: number;
  question: string;
  category: Category;
  answers: string[];
  correctAnswerIndex: number; // Índice de la respuesta correcta (0-3)
}

class QuestionsService {
  private baseURL = `${API_BASE_URL}/questions`;

  async getRandomQuestion(): Promise<Question> {
    try {
      const response = await fetch(`${this.baseURL}/random`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching random question:', error);
      throw error;
    }
  }

  async getQuestionByCategory(categoryId: number): Promise<Question> {
    try {
      const response = await fetch(`${this.baseURL}/category/${categoryId}/random`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching question by category:', error);
      throw error;
    }
  }
}

const questionsService = new QuestionsService();
export { questionsService }; 