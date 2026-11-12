# API pública de nexus-expediente

> Generado por `npm run api` a partir de `dist/*.d.ts`. No lo edites a mano.
> Si tu PR cambia este archivo, cambia la API: revisa que sea intencional y anótalo en el CHANGELOG.

## `nexus-expediente`

```ts
function aCsv(resumenes: readonly ResumenPersona[]): string;

interface Archivo {
    nombre: string;
    tamano: number;
    tipo?: string;
    url?: string;
}

interface ControlEquipo {
    elemento: HTMLElement;
    actualizar(documentos: Record<string, Documento[]>): void;
    resumen(): ResumenPersona[];
    destruir(): void;
}

interface ControlExpediente {
    elemento: HTMLElement;
    actualizar(documentos: Documento[]): void;
    resumen(): ResumenPersona;
    destruir(): void;
}

const cumple: (e: Estado) => boolean;

function diasEntre(desde: Fecha, hasta: Fecha): number;

interface Documento {
    requisitoId: string;
    archivo?: Archivo;
    entregadoEn?: Fecha;
    venceEn?: Fecha;
    revision?: 'pendiente' | 'aprobado' | 'rechazado';
    revisadoPor?: string;
    revisadoEn?: Fecha;
    motivo?: string;
    noAplica?: boolean;
}

type Estado = 'pendiente' | 'entregado' | 'aprobado' | 'rechazado' | 'por_vencer' | 'vencido' | 'no_aplica';

function estadoDe(req: Requisito, doc: Documento | undefined, o?: OpcionesFecha): Estado;

interface EventoExpediente {
    tipo: TipoEvento;
    personaId: string;
    requisitoId: string;
    en: string;
    actor?: string;
    antes?: Documento;
    despues?: Documento;
    motivo?: string;
}

type Fecha = string;

interface Fila {
    requisito: Requisito;
    documento?: Documento;
    estado: Estado;
    venceEn?: Fecha;
    dias?: number;
    obligatorio: boolean;
}

function filasDe(requisitos: readonly Requisito[], documentos: readonly Documento[], o?: OpcionesFecha, puesto?: string): Fila[];

function hoyLocal(ahora?: Date): Fecha;

function montarEquipo(destino: HTMLElement, o: OpcionesEquipo): ControlEquipo;

function montarExpediente(destino: HTMLElement, o: OpcionesExpediente): ControlExpediente;

interface OpcionesEquipo extends Comunes {
    personas: Persona[];
    requisitos: Requisito[];
    documentos: Record<string, Documento[]>;
    alAbrir?: (p: Persona) => void;
    alExportar?: (csv: string) => void;
}

interface OpcionesExpediente extends Comunes {
    persona: Persona;
    requisitos: Requisito[];
    documentos: Documento[];
    puedeSubir?: boolean;
    puedeRevisar?: boolean;
    actor?: string;
    alSubir?: (a: {
        persona: Persona;
        requisito: Requisito;
        archivo: File;
    }) => Promise<Partial<Documento> | void>;
    alRevisar?: (a: {
        persona: Persona;
        requisito: Requisito;
        decision: 'aprobado' | 'rechazado';
        motivo?: string;
    }) => Promise<void>;
    alQuitar?: (a: {
        persona: Persona;
        requisito: Requisito;
    }) => Promise<void>;
    alEvento?: (e: EventoExpediente) => void;
}

interface OpcionesFecha {
    hoy?: Fecha;
    diasAviso?: number;
}

interface Persona {
    id: string;
    nombre: string;
    puesto?: string;
}

interface Requisito {
    id: string;
    nombre: string;
    descripcion?: string;
    obligatorio?: boolean;
    vigenciaDias?: number;
    tipos?: string[];
    tamanoMaxMb?: number;
    puestos?: string[];
    requiereRevision?: boolean;
    categoria?: string;
}

function requisitosDe(requisitos: readonly Requisito[], puesto?: string): Requisito[];

interface ResultadoArchivo {
    ok: boolean;
    motivo?: 'tipo' | 'tamano' | 'vacio';
}

function resumenEquipo(personas: readonly Persona[], requisitos: readonly Requisito[], documentos: Readonly<Record<string, readonly Documento[]>>, o?: OpcionesFecha): ResumenPersona[];

function resumenPersona(persona: Persona, requisitos: readonly Requisito[], documentos: readonly Documento[], o?: OpcionesFecha): ResumenPersona;

interface ResumenPersona {
    persona: Persona;
    filas: Fila[];
    total: number;
    cumplidos: number;
    avance: number;
    faltantes: Fila[];
    porRevisar: Fila[];
    vencidos: Fila[];
    porVencer: Fila[];
    completo: boolean;
}

function sumarDias(f: Fecha, dias: number): Fecha;

interface Textos {
    estados: Record<Estado, string>;
    avance: string;
    obligatorio: string;
    opcional: string;
    subir: string;
    reemplazar: string;
    quitar: string;
    ver: string;
    aprobar: string;
    rechazar: string;
    motivo: string;
    confirmarRechazo: string;
    cancelar: string;
    mostrar: string;
    filtros: {
        todos: string;
        faltantes: string;
        porRevisar: string;
        vencidos: string;
    };
    vence: string;
    vencio: string;
    completo: string;
    resumen: string;
    sinRequisitos: string;
    errores: {
        tipo: string;
        tamano: string;
        vacio: string;
        fallo: string;
        motivoVacio: string;
    };
    anuncio: string;
    equipo: {
        persona: string;
        puesto: string;
        avance: string;
        faltan: string;
        vencidos: string;
        buscar: string;
        exportar: string;
        sinResultados: string;
        abrir: string;
    };
}

const TEXTOS_ES: Textos;

type TextosParciales = {
    [K in keyof Textos]?: Textos[K] extends string ? string : Partial<Textos[K]>;
};

type TipoEvento = 'documento.subido' | 'documento.aprobado' | 'documento.rechazado' | 'documento.quitado';

function validarArchivo(req: Requisito, archivo: {
    nombre: string;
    tamano: number;
    tipo?: string;
}): ResultadoArchivo;

function venceEnDe(req: Requisito, doc?: Documento): Fecha | undefined;
```

## `nexus-expediente/motor`

```ts
function aCsv(resumenes: readonly ResumenPersona[]): string;

interface Archivo {
    nombre: string;
    tamano: number;
    tipo?: string;
    url?: string;
}

const cumple: (e: Estado) => boolean;

function diasEntre(desde: Fecha, hasta: Fecha): number;

interface Documento {
    requisitoId: string;
    archivo?: Archivo;
    entregadoEn?: Fecha;
    venceEn?: Fecha;
    revision?: 'pendiente' | 'aprobado' | 'rechazado';
    revisadoPor?: string;
    revisadoEn?: Fecha;
    motivo?: string;
    noAplica?: boolean;
}

type Estado = 'pendiente' | 'entregado' | 'aprobado' | 'rechazado' | 'por_vencer' | 'vencido' | 'no_aplica';

function estadoDe(req: Requisito, doc: Documento | undefined, o?: OpcionesFecha): Estado;

interface EventoExpediente {
    tipo: TipoEvento;
    personaId: string;
    requisitoId: string;
    en: string;
    actor?: string;
    antes?: Documento;
    despues?: Documento;
    motivo?: string;
}

type Fecha = string;

interface Fila {
    requisito: Requisito;
    documento?: Documento;
    estado: Estado;
    venceEn?: Fecha;
    dias?: number;
    obligatorio: boolean;
}

function filasDe(requisitos: readonly Requisito[], documentos: readonly Documento[], o?: OpcionesFecha, puesto?: string): Fila[];

function hoyLocal(ahora?: Date): Fecha;

interface OpcionesFecha {
    hoy?: Fecha;
    diasAviso?: number;
}

interface Persona {
    id: string;
    nombre: string;
    puesto?: string;
}

interface Requisito {
    id: string;
    nombre: string;
    descripcion?: string;
    obligatorio?: boolean;
    vigenciaDias?: number;
    tipos?: string[];
    tamanoMaxMb?: number;
    puestos?: string[];
    requiereRevision?: boolean;
    categoria?: string;
}

function requisitosDe(requisitos: readonly Requisito[], puesto?: string): Requisito[];

interface ResultadoArchivo {
    ok: boolean;
    motivo?: 'tipo' | 'tamano' | 'vacio';
}

function resumenEquipo(personas: readonly Persona[], requisitos: readonly Requisito[], documentos: Readonly<Record<string, readonly Documento[]>>, o?: OpcionesFecha): ResumenPersona[];

function resumenPersona(persona: Persona, requisitos: readonly Requisito[], documentos: readonly Documento[], o?: OpcionesFecha): ResumenPersona;

interface ResumenPersona {
    persona: Persona;
    filas: Fila[];
    total: number;
    cumplidos: number;
    avance: number;
    faltantes: Fila[];
    porRevisar: Fila[];
    vencidos: Fila[];
    porVencer: Fila[];
    completo: boolean;
}

function sumarDias(f: Fecha, dias: number): Fecha;

type TipoEvento = 'documento.subido' | 'documento.aprobado' | 'documento.rechazado' | 'documento.quitado';

function validarArchivo(req: Requisito, archivo: {
    nombre: string;
    tamano: number;
    tipo?: string;
}): ResultadoArchivo;

function venceEnDe(req: Requisito, doc?: Documento): Fecha | undefined;
```

## `nexus-expediente/all`

```ts
{ montarExpediente, montarEquipo } from './ui.js';
export type { OpcionesExpediente, ControlExpediente, OpcionesEquipo, ControlEquipo } from './ui.js';
export * from './motor.js';
export type * from './tipos.js';
export { TEXTOS_ES } from './textos.js';
export type { Textos, TextosParciales } from './textos.js';

```
