import './comun'
import { montarExpediente } from 'nexus-expediente'
import { DOCS_LAURA, LAURA, REQUISITOS } from './datos-demo'

montarExpediente(document.getElementById('demo-inicio')!, { persona: LAURA, requisitos: REQUISITOS, documentos: DOCS_LAURA })
