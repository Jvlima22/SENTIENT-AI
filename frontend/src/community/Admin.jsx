import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Settings2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { errorMessage, Field, ROOT, State, useCommunityData } from "./shared";

const blankResource={slug:'',title:'',summary:'',category:'Fundamentos',kind:'Fluxo',level:'Iniciante',status:'soon',published:false,version:'1.0',keyword:'',video_url:'',video_vertical_url:'',outcomes:[],troubleshooting:[],requirements:'',costs:'',steps:[],body:'',workflow:null,reviewed:false};
const blankEvent={title:'',description:'',starts_at:'',duration_minutes:60,join_url:'',recording_url:'',published:false};
const resourceKeys=Object.keys(blankResource);
// Passos têm várias linhas (listas, blocos de código); por isso são separados por uma linha com ---.
const STEP_SEPARATOR='\n\n---\n\n';
export default function Admin() {
  const [tab,setTab]=useState('resources');
  const resources=useCommunityData('/admin/resources');
  const events=useCommunityData('/admin/events');
  const metrics=useCommunityData('/admin/metrics');
  const [editing,setEditing]=useState(null);
  const [eventId,setEventId]=useState('');
  const [form,setForm]=useState(blankResource);
  const [workflowText,setWorkflowText]=useState('');
  const [stepsText,setStepsText]=useState('');
  const [outcomesText,setOutcomesText]=useState('');
  const [faqText,setFaqText]=useState('');
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const change=(key,value)=>setForm(f=>({...f,[key]:value}));
  const editResource=item=>{setEditing(item.slug||'new');setForm({...item});setWorkflowText(item.workflow?JSON.stringify(item.workflow,null,2):'');setStepsText(item.steps.join(STEP_SEPARATOR));setOutcomesText((item.outcomes||[]).join('\n'));setFaqText((item.troubleshooting||[]).map(t=>t.problem+' | '+t.fix).join('\n'));setError('');};
  const editEvent=item=>{setEditing(item.id||'new');setEventId(item.id||crypto.randomUUID());const date=item.starts_at?new Date(item.starts_at):null;setForm({...item,starts_at:date?new Date(date.getTime()-date.getTimezoneOffset()*60000).toISOString().slice(0,16):''});setError('');};
  const save=async e=>{
    e.preventDefault();setBusy(true);setError('');
    try{
      if(tab==='resources'){
        let workflow=null;try{workflow=workflowText.trim()?JSON.parse(workflowText):null;}catch{throw new Error('O JSON do fluxo não está válido. Confira o arquivo exportado.');}
        const payload=Object.fromEntries(resourceKeys.map(k=>[k,form[k]]));
        payload.workflow=workflow;payload.steps=stepsText.split(/\n\s*-{3,}\s*(?:\n|$)/).map(s=>s.trim()).filter(Boolean);
        payload.outcomes=outcomesText.split('\n').map(s=>s.trim()).filter(Boolean);
        payload.troubleshooting=faqText.split('\n').map(s=>s.trim()).filter(Boolean).map(line=>{const [problem,...fix]=line.split('|');if(!fix.length)throw new Error('Em Erros comuns, separe problema e solução com |.');return {problem:problem.trim(),fix:fix.join('|').trim()};});
        await api.put(ROOT+'/admin/resources/'+form.slug,payload);resources.refresh();
      }else{
        const payload=Object.fromEntries(Object.keys(blankEvent).map(k=>[k,form[k]]));
        payload.starts_at=new Date(form.starts_at).toISOString();payload.duration_minutes=Number(form.duration_minutes);
        await api.put(ROOT+'/admin/events/'+eventId,payload);events.refresh();
      }
      toast.success('Alterações salvas');setEditing(null);
    }catch(e){setError(e.response?errorMessage(e):e.message);}finally{setBusy(false);}
  };
  const upload=async e=>{const file=e.target.files?.[0];if(!file)return;if(file.size>1000000){setError('O arquivo deve ter no máximo 1 MB.');return;}setWorkflowText(await file.text());change('reviewed',false);};
  const field=(label,key,props={})=><Field label={label}><input value={form[key]||''} onChange={e=>change(key,e.target.value)} {...props}/></Field>;
  const select=(label,key,options)=><Field label={label}><select value={form[key]} onChange={e=>change(key,e.target.value)}>{options.map(([value,text])=><option key={value} value={value}>{text}</option>)}</select></Field>;
  const list=tab==='resources'?resources:events;
  return <><div className="c-page-title"><h1>Administrar comunidade</h1><p>Prepare os materiais, organize encontros e acompanhe a participação.</p></div><State {...metrics} retry={metrics.refresh}><div className="c-metrics">{[['signup','Entraram na comunidade'],['download','Membros que baixaram'],['participation','Participaram'],['returning','Voltaram em outro dia'],['vip_waitlist','Lista de espera VIP (total)']].map(([key,label])=><div key={key}><strong>{metrics.data?.[key]??0}</strong><span>{label}</span></div>)}</div><p className="c-hint">Últimos 7 dias, membros únicos. A lista do VIP é o total acumulado.</p>{metrics.data?.origins?.length>0 && <table className="c-table"><thead><tr><th>Origem</th><th>Palavra-chave</th><th>Novos membros</th></tr></thead><tbody>{metrics.data.origins.map(o=><tr key={o.source+o.keyword}><td>{o.source==='instagram'?'Instagram':o.source==='direto'?'Direto':o.source}</td><td>{o.keyword?'#'+o.keyword:'—'}</td><td>{o.members}</td></tr>)}</tbody></table>}</State><div className="c-section-heading"><div className="c-filters">{[['resources','Materiais'],['events','Encontros']].map(([key,label])=><button key={key} aria-pressed={tab===key} onClick={()=>{setTab(key);setEditing(null);}}>{label}</button>)}</div><Link className="c-text-link" to="/comunidade/chat">Moderar o chat</Link><Link className="c-text-link" to="/comunidade/anuncios">Publicar anúncio</Link><button className="c-button primary" onClick={()=>tab==='resources'?editResource(blankResource):editEvent(blankEvent)}><Plus size={16}/>Adicionar</button></div>
    {editing!==null && <form className="c-form c-admin-form" onSubmit={save}><h2>{editing==='new'?'Novo':'Editar'} {tab==='resources'?'material':'encontro'}</h2>{error && <p className="c-error" role="alert">{error}</p>}{field('Título','title',{required:true,minLength:3,maxLength:120})}{tab==='resources'?<>
      {field('Endereço do material','slug',{required:true,pattern:'[a-z0-9]+(-[a-z0-9]+)*',maxLength:80,disabled:editing!=='new',placeholder:'exemplo-de-fluxo'})}
      <Field label="Resumo"><textarea required minLength={10} maxLength={400} rows={2} value={form.summary} onChange={e=>change('summary',e.target.value)}/></Field>
      <div className="c-form-row">{select('Categoria','category',['Prospecção','Atendimento','CRM','Fundamentos'].map(v=>[v,v]))}{select('Formato','kind',['Fluxo','Guia','Template','Skill'].map(v=>[v,v]))}{select('Nível','level',['Iniciante','Intermediário','Avançado'].map(v=>[v,v]))}</div>
      <div className="c-form-row">{select('Disponibilidade','status',[['soon','Em preparação'],['ready','Disponível para download']])}{field('Versão','version',{required:true,maxLength:30})}</div>
      <div className="c-form-row">{field('Palavra-chave do post','keyword',{pattern:'[A-Za-z0-9]{0,30}',maxLength:30,placeholder:'CNPJ'})}{field('Vídeo 16:9 para desktop (/motion/arquivo.mp4, YouTube ou HTTPS)','video_url',{placeholder:'/motion/arquivo-16x9.mp4'})}{field('Vídeo 9:16 para celular (opcional)','video_vertical_url',{placeholder:'/motion/arquivo-9x16.mp4'})}</div>
      {form.keyword && <p className="c-hint">Link para a DM: {window.location.origin}/c/{form.keyword.toLowerCase()}</p>}
      <Field label="Resultados em destaque (um por linha, até 6)"><textarea rows={3} value={outcomesText} onChange={e=>setOutcomesText(e.target.value)}/></Field>
      <Field label="Requisitos"><textarea maxLength={3000} value={form.requirements} onChange={e=>change('requirements',e.target.value)}/></Field><Field label="Custos"><textarea maxLength={2000} value={form.costs} onChange={e=>change('costs',e.target.value)}/></Field>
      <Field label="Apresentação / conteúdo do guia (Markdown: títulos, listas e blocos de código)"><textarea rows={5} maxLength={30000} value={form.body} onChange={e=>change('body',e.target.value)}/></Field><Field label="Passo a passo: comece cada passo com **Título.** e separe os passos com uma linha contendo ---"><textarea rows={10} placeholder={"**Instalar o Docker.**\nDescrição do passo...\n---\n**Instalar o n8n local.**\nDescrição..."} value={stepsText} onChange={e=>setStepsText(e.target.value)}/></Field><Field label="Erros comuns (um por linha: problema | solução)"><textarea rows={3} value={faqText} onChange={e=>setFaqText(e.target.value)}/></Field>
      {form.kind==='Fluxo' && <><Field label="Importar JSON do n8n"><input type="file" accept=".json,application/json" onChange={upload}/></Field><Field label="JSON do fluxo"><textarea rows={6} value={workflowText} onChange={e=>{setWorkflowText(e.target.value);change('reviewed',false);}} spellCheck={false}/></Field></>}
      <label className="c-check"><input type="checkbox" checked={form.reviewed} onChange={e=>change('reviewed',e.target.checked)}/>Revisei o conteúdo, as instruções e a ausência de credenciais e dados privados.</label>
    </>:<><Field label="Descrição"><textarea required minLength={5} maxLength={3000} rows={3} value={form.description} onChange={e=>change('description',e.target.value)}/></Field><div className="c-form-row">{field('Data e hora (horário deste dispositivo)','starts_at',{type:'datetime-local',required:true})}{field('Duração em minutos','duration_minutes',{type:'number',min:15,max:480,required:true})}</div>{field('Link do encontro (HTTPS)','join_url',{type:'url'})}{field('Link da gravação (HTTPS)','recording_url',{type:'url'})}</>}
      <label className="c-check"><input type="checkbox" checked={form.published} onChange={e=>change('published',e.target.checked)}/>Visível na comunidade</label><div className="c-actions"><button className="c-button primary" disabled={busy}>{busy?'Salvando…':'Salvar alterações'}</button><button className="c-button" type="button" onClick={()=>setEditing(null)} disabled={busy}>Cancelar</button></div></form>}
    <State {...list} retry={list.refresh}>{list.data?.length ? <div className="c-admin-list">{list.data.map(item=><div key={item.slug||item.id}><Settings2 size={19}/><div><strong>{item.title}</strong><p>{item.published?'Visível':'Rascunho'}{item.status ? ' • '+(item.status==='ready'?'Download disponível':'Em preparação'):''}</p></div><button className="c-button" onClick={()=>tab==='resources'?editResource(item):editEvent(item)}>Editar</button></div>)}</div>:<div className="c-empty"><h2>{tab==='events'?'Nenhum encontro cadastrado':'Nenhum material cadastrado'}</h2><p>Use Adicionar para preparar o primeiro.</p></div>}</State>
  </>;
}
