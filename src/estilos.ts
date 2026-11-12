// CSS de las dos vistas. Vive en una cadena: el plugin css-en-plantillas la comprime al compilar.
const CLARO = `
  --ex-fondo:#fff;--ex-tarjeta:#faf8ff;--ex-texto:#1a1530;--ex-suave:#4b4563;--ex-borde:#d6d0e6;
  --ex-acento:#5b21b6;--ex-sobre:#fff;--ex-foco:#5b21b6;
  --ex-ok-f:#dcfce7;--ex-ok-t:#14532d;--ex-rev-f:#e0e7ff;--ex-rev-t:#312e81;--ex-pen-f:#eceaf3;--ex-pen-t:#2f2a45;
  --ex-mal-f:#fee2e2;--ex-mal-t:#7f1d1d;--ex-av-f:#fef3c7;--ex-av-t:#78350f;
`
const OSCURO = `
  --ex-fondo:#16111f;--ex-tarjeta:#1e1830;--ex-texto:#f1ecf9;--ex-suave:#c9c1de;--ex-borde:#3d3558;
  --ex-acento:#c4b5fd;--ex-sobre:#1e1b4b;--ex-foco:#c4b5fd;
  --ex-ok-f:#14532d;--ex-ok-t:#dcfce7;--ex-rev-f:#312e81;--ex-rev-t:#e0e7ff;--ex-pen-f:#3a3352;--ex-pen-t:#f1ecf9;
  --ex-mal-f:#7f1d1d;--ex-mal-t:#fee2e2;--ex-av-f:#78350f;--ex-av-t:#fef3c7;
`

export const ESTILOS_CSS = `
:host{display:block;${CLARO}color:var(--ex-texto);font:15px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
:host([data-tema="oscuro"]){${OSCURO}color-scheme:dark}
@media (prefers-color-scheme:dark){:host(:not([data-tema="claro"])){${OSCURO}color-scheme:dark}}
*,*::before,*::after{box-sizing:border-box}
.raiz{background:var(--ex-fondo);border:1px solid var(--ex-borde);border-radius:16px;padding:20px;display:grid;gap:16px}
:focus-visible{outline:3px solid var(--ex-foco);outline-offset:2px}
h2,h3,p,ul{margin:0}
ul{list-style:none;padding:0}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
.cab{display:grid;gap:12px}
.persona{display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 12px}
.persona h2{font-size:1.25rem;line-height:1.2}
.persona span{color:var(--ex-suave)}
.avance{display:grid;gap:6px}
.avance-fila{display:flex;justify-content:space-between;gap:12px;font-size:.9rem;color:var(--ex-suave)}
.avance-fila strong{color:var(--ex-texto);font-variant-numeric:tabular-nums}
progress{width:100%;height:10px;appearance:none;-webkit-appearance:none;border:0;border-radius:99px;overflow:hidden;background:var(--ex-borde)}
progress::-webkit-progress-bar{background:var(--ex-borde)}
progress::-webkit-progress-value{background:var(--ex-acento);border-radius:99px}
progress::-moz-progress-bar{background:var(--ex-acento)}
.filtro{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
label{font-size:.9rem;color:var(--ex-suave)}
select,input[type=text],input[type=search]{font:inherit;color:var(--ex-texto);background:var(--ex-fondo);border:1px solid var(--ex-borde);border-radius:10px;padding:8px 10px;min-height:40px}
.cat{font-size:.8rem;text-transform:uppercase;letter-spacing:.06em;color:var(--ex-suave);margin:8px 0 6px}
.fila{display:grid;gap:8px;padding:14px;border:1px solid var(--ex-borde);border-radius:12px;background:var(--ex-tarjeta);margin-bottom:8px}
.fila-cab{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px}
.nombre{font-weight:600}
.nombre small{font-weight:400;color:var(--ex-suave);margin-left:6px}
.desc,.meta{color:var(--ex-suave);font-size:.9rem}
.insignia{display:inline-flex;align-items:center;gap:6px;padding:2px 10px;border-radius:99px;font-size:.82rem;font-weight:600;white-space:nowrap}
.e-aprobado{background:var(--ex-ok-f);color:var(--ex-ok-t)}
.e-entregado{background:var(--ex-rev-f);color:var(--ex-rev-t)}
.e-pendiente,.e-no_aplica{background:var(--ex-pen-f);color:var(--ex-pen-t)}
.e-rechazado,.e-vencido{background:var(--ex-mal-f);color:var(--ex-mal-t)}
.e-por_vencer{background:var(--ex-av-f);color:var(--ex-av-t)}
.acciones{display:flex;flex-wrap:wrap;gap:8px}
button,.enlace{font:inherit;min-height:40px;padding:8px 14px;border-radius:10px;border:1px solid var(--ex-borde);background:var(--ex-fondo);color:var(--ex-texto);cursor:pointer;text-decoration:none;display:inline-flex;align-items:center}
button:hover,.enlace:hover{border-color:var(--ex-acento)}
button.p{background:var(--ex-acento);border-color:var(--ex-acento);color:var(--ex-sobre);font-weight:600}
button[disabled]{opacity:.6;cursor:progress}
.rechazo{display:grid;gap:8px}
.rechazo input{width:100%}
.err{color:var(--ex-mal-t);background:var(--ex-mal-f);padding:6px 10px;border-radius:8px;font-size:.9rem}
.vacio{color:var(--ex-suave);padding:12px 0}
.estrecho .raiz{padding:14px}
.tabla-eq{width:100%;border-collapse:collapse}
.tabla-eq th,.tabla-eq td{text-align:left;padding:10px 8px;border-bottom:1px solid var(--ex-borde);vertical-align:middle}
.tabla-eq th{font-size:.82rem;color:var(--ex-suave);font-weight:600}
.tabla-eq th button{border:0;background:none;padding:0;min-height:0;font-weight:600;color:var(--ex-suave)}
.tabla-eq td.num{font-variant-numeric:tabular-nums}
.tabla-eq progress{width:120px;display:inline-block;vertical-align:middle;margin-right:8px}
.nom-btn{border:0;background:none;padding:0;min-height:0;font-weight:600;color:var(--ex-acento);text-decoration:underline;text-underline-offset:3px}
.barra{display:flex;flex-wrap:wrap;gap:12px;align-items:end;justify-content:space-between}
.barra .campo{display:grid;gap:4px}
.estrecho .tabla-eq thead{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}
.estrecho .tabla-eq,.estrecho .tabla-eq tbody,.estrecho .tabla-eq tr,.estrecho .tabla-eq td{display:block;width:100%}
.estrecho .tabla-eq tr{padding:10px 0;border-bottom:1px solid var(--ex-borde)}
.estrecho .tabla-eq td{border:0;padding:3px 0}
.estrecho .tabla-eq td[data-et]::before{content:attr(data-et) ": ";color:var(--ex-suave);font-size:.85rem}
@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
`
