import express from 'express';
import db from '../database/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all monthly data for user
router.get('/monthly-data', async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const monthlyData = await db.all(
      `SELECT md.id, md.month, md.salary, md.created_at, md.updated_at,
       COALESCE(
         json_group_array(
           json_object(
             'id', e.id,
             'date', e.date,
             'category', e.category,
             'subcategory', e.subcategory,
             'amount', e.amount,
             'notes', e.notes,
             'recurringId', e.recurring_id,
             'paymentMethod', e.payment_method
           )
         ),
         '[]'
       ) as expenses
       FROM monthly_data md
       LEFT JOIN expenses e ON md.id = e.monthly_data_id
       WHERE md.user_id = ?
       GROUP BY md.id, md.month, md.salary
       ORDER BY md.month`,
      [userId]
    );

    // Parse expenses JSON strings
    const formattedData = monthlyData.map(row => ({
      month: row.month,
      salary: row.salary,
      expenses: row.expenses ? JSON.parse(row.expenses) : []
    }));

    res.json({ data: formattedData });
  } catch (error) {
    console.error('Get monthly data error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get or create monthly data for a specific month
router.get('/monthly-data/:month', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { month } = req.params;

    let monthlyData = await db.get(
      'SELECT * FROM monthly_data WHERE user_id = ? AND month = ?',
      [userId, month]
    );

    if (!monthlyData) {
      // Create new monthly data entry
      const result = await db.run(
        'INSERT INTO monthly_data (user_id, month, salary) VALUES (?, ?, 0)',
        [userId, month]
      );
      monthlyData = {
        id: result.lastID,
        user_id: userId,
        month,
        salary: 0
      };
    }

    // Get expenses for this month
    const expenses = await db.all(
      `SELECT id, date, category, subcategory, amount, notes, recurring_id as recurringId, payment_method as paymentMethod
       FROM expenses
       WHERE monthly_data_id = ?
       ORDER BY date`,
      [monthlyData.id]
    );

    res.json({
      month: monthlyData.month,
      salary: monthlyData.salary,
      expenses: expenses
    });
  } catch (error) {
    console.error('Get monthly data error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update salary for a month
router.put('/monthly-data/:month/salary', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { month } = req.params;
    const { salary } = req.body;

    // Get or create monthly data
    let monthlyData = await db.get(
      'SELECT id FROM monthly_data WHERE user_id = ? AND month = ?',
      [userId, month]
    );

    if (!monthlyData) {
      const result = await db.run(
        'INSERT INTO monthly_data (user_id, month, salary) VALUES (?, ?, ?)',
        [userId, month, salary]
      );
      monthlyData = { id: result.lastID };
    } else {
      await db.run(
        'UPDATE monthly_data SET salary = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [salary, monthlyData.id]
      );
    }

    res.json({ message: 'Salary updated successfully' });
  } catch (error) {
    console.error('Update salary error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add expense
router.post('/expenses', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { month, expense } = req.body;

    // Get or create monthly data
    let monthlyData = await db.get(
      'SELECT id FROM monthly_data WHERE user_id = ? AND month = ?',
      [userId, month]
    );

    if (!monthlyData) {
      const result = await db.run(
        'INSERT INTO monthly_data (user_id, month, salary) VALUES (?, ?, 0)',
        [userId, month]
      );
      monthlyData = { id: result.lastID };
    }

    const expenseId = expense.id || `exp-${Date.now()}-${Math.random()}`;

    await db.run(
      `INSERT INTO expenses (id, user_id, monthly_data_id, date, category, subcategory, amount, notes, recurring_id, payment_method)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        expenseId,
        userId,
        monthlyData.id,
        expense.date,
        expense.category,
        expense.subcategory || null,
        expense.amount,
        expense.notes || null,
        expense.recurringId || null,
        expense.paymentMethod || null
      ]
    );

    res.status(201).json({ message: 'Expense added successfully', id: expenseId });
  } catch (error) {
    console.error('Add expense error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update expense
router.put('/expenses/:id', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const expense = req.body;

    // Verify expense belongs to user
    const existing = await db.get(
      'SELECT id FROM expenses WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (!existing) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    await db.run(
      `UPDATE expenses 
       SET date = ?, category = ?, subcategory = ?, amount = ?, notes = ?, payment_method = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ?`,
      [
        expense.date,
        expense.category,
        expense.subcategory || null,
        expense.amount,
        expense.notes || null,
        expense.paymentMethod || null,
        id,
        userId
      ]
    );

    res.json({ message: 'Expense updated successfully' });
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete expense
router.delete('/expenses/:id', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const result = await db.run(
      'DELETE FROM expenses WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get categories
router.get('/categories', async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const categories = await db.all(
      'SELECT name, color FROM categories WHERE user_id = ? ORDER BY name',
      [userId]
    );

    const categoryList = categories.map(c => c.name);
    const categoryColors = {};
    categories.forEach(c => {
      categoryColors[c.name] = c.color;
    });

    res.json({ categories: categoryList, categoryColors });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add category
router.post('/categories', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, color } = req.body;

    await db.run(
      'INSERT OR IGNORE INTO categories (user_id, name, color) VALUES (?, ?, ?)',
      [userId, name, color]
    );

    res.status(201).json({ message: 'Category added successfully' });
  } catch (error) {
    console.error('Add category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete category
router.delete('/categories/:name', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name } = req.params;

    // Check if category is used in expenses
    const used = await db.get(
      'SELECT COUNT(*) as count FROM expenses WHERE user_id = ? AND category = ?',
      [userId, name]
    );

    if (used.count > 0) {
      return res.status(400).json({ error: 'Category is in use and cannot be deleted' });
    }

    await db.run(
      'DELETE FROM categories WHERE user_id = ? AND name = ?',
      [userId, name]
    );

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get budgets
router.get('/budgets', async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const budgets = await db.all(
      'SELECT month, category, amount FROM budgets WHERE user_id = ?',
      [userId]
    );

    const budgetMap = {};
    budgets.forEach(b => {
      if (!budgetMap[b.month]) {
        budgetMap[b.month] = {};
      }
      budgetMap[b.month][b.category] = b.amount;
    });

    res.json({ budgets: budgetMap });
  } catch (error) {
    console.error('Get budgets error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Set budget
router.post('/budgets', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { month, category, amount } = req.body;

    await db.run(
      `INSERT INTO budgets (user_id, month, category, amount)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(user_id, month, category) DO UPDATE SET amount = ?, updated_at = CURRENT_TIMESTAMP`,
      [userId, month, category, amount, amount]
    );

    res.status(201).json({ message: 'Budget set successfully' });
  } catch (error) {
    console.error('Set budget error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get payment methods
router.get('/payment-methods', async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const methods = await db.all(
      'SELECT name, color FROM payment_methods WHERE user_id = ? ORDER BY name',
      [userId]
    );

    const methodList = methods.map(m => m.name);
    const methodColors = {};
    methods.forEach(m => {
      methodColors[m.name] = m.color;
    });

    res.json({ paymentMethods: methodList, paymentMethodColors: methodColors });
  } catch (error) {
    console.error('Get payment methods error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add payment method
router.post('/payment-methods', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, color } = req.body;

    await db.run(
      'INSERT OR IGNORE INTO payment_methods (user_id, name, color) VALUES (?, ?, ?)',
      [userId, name, color]
    );

    res.status(201).json({ message: 'Payment method added successfully' });
  } catch (error) {
    console.error('Add payment method error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete payment method
router.delete('/payment-methods/:name', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name } = req.params;

    await db.run(
      'DELETE FROM payment_methods WHERE user_id = ? AND name = ?',
      [userId, name]
    );

    res.json({ message: 'Payment method deleted successfully' });
  } catch (error) {
    console.error('Delete payment method error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get recurring expenses
router.get('/recurring-expenses', async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const recurring = await db.all(
      `SELECT id, description, amount, category, day_of_month as dayOfMonth, start_date as startDate, payment_method as paymentMethod
       FROM recurring_expenses
       WHERE user_id = ?
       ORDER BY created_at`,
      [userId]
    );

    res.json({ recurringExpenses: recurring });
  } catch (error) {
    console.error('Get recurring expenses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add recurring expense
router.post('/recurring-expenses', async (req, res) => {
  try {
    const userId = req.user.userId;
    const expense = req.body;

    const id = expense.id || `rec-${Date.now()}`;

    await db.run(
      `INSERT INTO recurring_expenses (id, user_id, description, amount, category, day_of_month, start_date, payment_method)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        userId,
        expense.description,
        expense.amount,
        expense.category,
        expense.dayOfMonth,
        expense.startDate,
        expense.paymentMethod || null
      ]
    );

    res.status(201).json({ message: 'Recurring expense added successfully', id });
  } catch (error) {
    console.error('Add recurring expense error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete recurring expense
router.delete('/recurring-expenses/:id', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    await db.run(
      'DELETE FROM recurring_expenses WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    res.json({ message: 'Recurring expense deleted successfully' });
  } catch (error) {
    console.error('Delete recurring expense error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get recurring templates
router.get('/recurring-templates', async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const templates = await db.all(
      `SELECT id, name, description, amount, category, day_of_month as dayOfMonth, payment_method as paymentMethod
       FROM recurring_templates
       WHERE user_id = ?
       ORDER BY created_at`,
      [userId]
    );

    res.json({ templates });
  } catch (error) {
    console.error('Get recurring templates error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add recurring template
router.post('/recurring-templates', async (req, res) => {
  try {
    const userId = req.user.userId;
    const template = req.body;

    const id = template.id || `template-${Date.now()}`;

    await db.run(
      `INSERT INTO recurring_templates (id, user_id, name, description, amount, category, day_of_month, payment_method)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        userId,
        template.name,
        template.description,
        template.amount,
        template.category,
        template.dayOfMonth,
        template.paymentMethod || null
      ]
    );

    res.status(201).json({ message: 'Template added successfully', id });
  } catch (error) {
    console.error('Add recurring template error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete recurring template
router.delete('/recurring-templates/:id', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    await db.run(
      'DELETE FROM recurring_templates WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Delete recurring template error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get savings goals
router.get('/savings-goals', async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const goals = await db.all(
      `SELECT id, name, target_amount as targetAmount, current_amount as currentAmount, 
       target_date as targetDate, category
       FROM savings_goals
       WHERE user_id = ?
       ORDER BY created_at`,
      [userId]
    );

    // Get contributions for each goal
    for (const goal of goals) {
      const contributions = await db.all(
        `SELECT id, amount, date, notes
         FROM savings_contributions
         WHERE goal_id = ?
         ORDER BY date`,
        [goal.id]
      );
      goal.contributions = contributions;
    }

    res.json({ savingsGoals: goals });
  } catch (error) {
    console.error('Get savings goals error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add savings goal
router.post('/savings-goals', async (req, res) => {
  try {
    const userId = req.user.userId;
    const goal = req.body;

    const id = goal.id || `goal-${Date.now()}`;

    await db.run(
      `INSERT INTO savings_goals (id, user_id, name, target_amount, current_amount, target_date, category)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        userId,
        goal.name,
        goal.targetAmount,
        goal.currentAmount || 0,
        goal.targetDate,
        goal.category || null
      ]
    );

    res.status(201).json({ message: 'Savings goal added successfully', id });
  } catch (error) {
    console.error('Add savings goal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update savings goal
router.put('/savings-goals/:id', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const goal = req.body;

    await db.run(
      `UPDATE savings_goals
       SET name = ?, target_amount = ?, current_amount = ?, target_date = ?, category = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ?`,
      [
        goal.name,
        goal.targetAmount,
        goal.currentAmount,
        goal.targetDate,
        goal.category || null,
        id,
        userId
      ]
    );

    res.json({ message: 'Savings goal updated successfully' });
  } catch (error) {
    console.error('Update savings goal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete savings goal
router.delete('/savings-goals/:id', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    await db.run(
      'DELETE FROM savings_goals WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    res.json({ message: 'Savings goal deleted successfully' });
  } catch (error) {
    console.error('Delete savings goal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add savings contribution
router.post('/savings-goals/:id/contributions', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const contribution = req.body;

    const contributionId = contribution.id || `contrib-${Date.now()}`;

    // Add contribution
    await db.run(
      `INSERT INTO savings_contributions (id, goal_id, user_id, amount, date, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        contributionId,
        id,
        userId,
        contribution.amount,
        contribution.date,
        contribution.notes || null
      ]
    );

    // Update goal current amount
    await db.run(
      `UPDATE savings_goals
       SET current_amount = current_amount + ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ?`,
      [contribution.amount, id, userId]
    );

    res.status(201).json({ message: 'Contribution added successfully', id: contributionId });
  } catch (error) {
    console.error('Add contribution error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

