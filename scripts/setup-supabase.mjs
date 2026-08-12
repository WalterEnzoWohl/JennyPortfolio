import { createClient } from '@supabase/supabase-js'
import { defaultPortfolioContent } from '../src/content.ts'

process.loadEnvFile('.env')

const supabaseUrl = process.env.SUPABASE_URL
const secretKey = process.env.SUPABASE_SECRET_KEY
const password = process.env.ADMIN_INITIAL_PASSWORD
const adminEmail = 'admin@jennyportfolio.local'
const mediaBucket = 'portfolio-media'
const analyticsBucket = 'portfolio-analytics'
const contentPath = 'content/portfolio.json'

if (!supabaseUrl || !secretKey || !password) {
  throw new Error('Faltan SUPABASE_URL, SUPABASE_SECRET_KEY o ADMIN_INITIAL_PASSWORD en .env')
}

const supabaseAdmin = createClient(supabaseUrl, secretKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
})

const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
if (usersError) throw usersError

const existingAdmin = usersData.users.find((user) => user.email === adminEmail)
if (existingAdmin) {
  const { error } = await supabaseAdmin.auth.admin.updateUserById(existingAdmin.id, {
    password,
    email_confirm: true,
    app_metadata: { ...existingAdmin.app_metadata, role: 'portfolio_admin' },
  })
  if (error) throw error
  console.log('Administrador actualizado.')
} else {
  const { error } = await supabaseAdmin.auth.admin.createUser({
    email: adminEmail,
    password,
    email_confirm: true,
    app_metadata: { role: 'portfolio_admin' },
  })
  if (error) throw error
  console.log('Administrador creado.')
}

await ensureBucket(mediaBucket, {
  public: true,
  allowedMimeTypes: ['application/json', 'image/*', 'video/*'],
  fileSizeLimit: 50 * 1024 * 1024,
})
await ensureBucket(analyticsBucket, {
  public: false,
  allowedMimeTypes: ['application/json'],
})

const { data: existingContent } = await supabaseAdmin.storage.from(mediaBucket).download(contentPath)
if (existingContent) {
  console.log('El contenido remoto existente se conservó.')
} else {
  const { error } = await supabaseAdmin.storage.from(mediaBucket).upload(
    contentPath,
    new Blob([JSON.stringify(defaultPortfolioContent)], { type: 'application/json' }),
    { contentType: 'application/json', cacheControl: '0' },
  )
  if (error) throw error
  console.log('Contenido inicial publicado.')
}

async function ensureBucket(name, options) {
  const { data: existingBucket } = await supabaseAdmin.storage.getBucket(name)
  const operation = existingBucket
    ? supabaseAdmin.storage.updateBucket(name, options)
    : supabaseAdmin.storage.createBucket(name, options)
  const { error } = await operation

  if (error) throw error
  console.log(`${name}: ${existingBucket ? 'actualizado' : 'creado'}.`)
}
