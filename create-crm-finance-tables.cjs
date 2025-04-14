// Script para criar tabelas de CRM e Finanças
require('dotenv').config();
const { Pool } = require('pg');

async function createTables() {
  // Conexão com o banco de dados
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  console.log('Iniciando criação das tabelas de CRM e Finanças...');

  try {
    // Criar ENUMS
    await pool.query(`
      -- Enum para status de leads
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lead_status') THEN
          CREATE TYPE lead_status AS ENUM ('novo', 'contatado', 'qualificado', 'negociacao', 'convertido', 'perdido');
        END IF;
      END $$;

      -- Enum para tipos de cliente
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'client_type') THEN
          CREATE TYPE client_type AS ENUM ('pf', 'pj');
        END IF;
      END $$;

      -- Enum para status de faturas
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invoice_status') THEN
          CREATE TYPE invoice_status AS ENUM ('draft', 'pending', 'paid', 'overdue', 'cancelled', 'partial');
        END IF;
      END $$;

      -- Enum para métodos de pagamento
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN
          CREATE TYPE payment_method AS ENUM ('credit_card', 'bank_slip', 'pix', 'bank_transfer', 'cash', 'debit_card', 'other');
        END IF;
      END $$;

      -- Enum para status de pagamentos
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
          CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'refunded', 'failed');
        END IF;
      END $$;
    `);

    // Tabela de leads
    await pool.query(`
      CREATE TABLE IF NOT EXISTS leads (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        company TEXT,
        source TEXT,
        interest TEXT,
        status lead_status DEFAULT 'novo' NOT NULL,
        notes TEXT,
        created_by_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);

    // Tabela de clientes
    await pool.query(`
      CREATE TABLE IF NOT EXISTS clients (
        id SERIAL PRIMARY KEY,
        number TEXT NOT NULL,
        name TEXT NOT NULL,
        type client_type DEFAULT 'pf' NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        cpf_cnpj TEXT NOT NULL,
        rg_ie TEXT,
        birth_date TIMESTAMP,
        zip_code TEXT,
        street TEXT,
        number_address TEXT,
        complement TEXT,
        neighborhood TEXT,
        city TEXT,
        state TEXT,
        observation TEXT,
        asaas_id TEXT,
        created_by_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);

    // Tabela de contatos (contatos adicionais do cliente)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id SERIAL PRIMARY KEY,
        client_id INTEGER NOT NULL REFERENCES clients(id),
        name TEXT NOT NULL,
        role TEXT,
        email TEXT,
        phone TEXT,
        is_main BOOLEAN DEFAULT FALSE,
        created_by_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);

    // Tabela de produtos/serviços
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT,
        price DOUBLE PRECISION NOT NULL,
        active BOOLEAN DEFAULT TRUE,
        created_by_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);

    // Tabela de faturas
    await pool.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id SERIAL PRIMARY KEY,
        client_id INTEGER NOT NULL REFERENCES clients(id),
        invoice_number TEXT NOT NULL,
        issue_date TIMESTAMP NOT NULL,
        due_date TIMESTAMP NOT NULL,
        total DOUBLE PRECISION NOT NULL,
        subtotal DOUBLE PRECISION NOT NULL,
        discount DOUBLE PRECISION DEFAULT 0,
        tax DOUBLE PRECISION DEFAULT 0,
        status invoice_status DEFAULT 'draft' NOT NULL,
        notes TEXT,
        created_by_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);

    // Tabela de itens da fatura
    await pool.query(`
      CREATE TABLE IF NOT EXISTS invoice_items (
        id SERIAL PRIMARY KEY,
        invoice_id INTEGER NOT NULL REFERENCES invoices(id),
        product_id INTEGER REFERENCES products(id),
        description TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        price DOUBLE PRECISION NOT NULL,
        total DOUBLE PRECISION NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);

    // Tabela de pagamentos
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        invoice_id INTEGER NOT NULL REFERENCES invoices(id),
        amount DOUBLE PRECISION NOT NULL,
        method payment_method NOT NULL,
        payment_date TIMESTAMP NOT NULL,
        status payment_status DEFAULT 'completed' NOT NULL,
        transaction_id TEXT,
        notes TEXT,
        asaas_id TEXT,
        payment_url TEXT,
        payment_link_url TEXT,
        bank_slip_url TEXT,
        pix_qr_code_url TEXT,
        pix_code_text TEXT,
        created_by_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);

    console.log('Tabelas criadas com sucesso!');
  } catch (error) {
    console.error('Erro durante a criação das tabelas:', error);
  } finally {
    await pool.end();
  }
}

// Executar script
createTables().catch(console.error);