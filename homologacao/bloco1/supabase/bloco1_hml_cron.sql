do $$
declare cmd text;
begin
 select command into strict cmd from cron.job where jobname='obrix-hml-efi-readonly-20261120' and active;
 if position('https://xavwkfgrnowmusbkbiea.supabase.co/functions/v1/obrix-hml-efi-conciliar-pendentes-20261120' in cmd)=0
   or position('x-obrix-hml-cron-token' in cmd)=0 or position('vault.' in cmd)=0 then raise exception 'Configuração de origem incompatível'; end if;
 cmd:=replace(cmd,'/functions/v1/obrix-hml-efi-conciliar-pendentes-20261120','/functions/v1/obrix-hml-conciliar-bloco1');
 perform cron.schedule('obrix-hml-conciliar-bloco1','3-59/5 * * * *',cmd);
end $$;
