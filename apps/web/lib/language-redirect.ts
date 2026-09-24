import { routing } from '@/i18n/routing'
import { env } from './env'

export const LANGUAGE_KEY = 'lang'

/**
 * Inline script for the root URL. Static hosting cannot negotiate languages on the server, so the
 * browser picks one: the stored choice if there is one, otherwise navigator.language (stored so
 * the detection only happens once). Query and hash are kept so shared links survive the redirect.
 */
export const languageRedirectScript = `(function(){
var locales=${JSON.stringify(routing.locales)},fallback=${JSON.stringify(routing.defaultLocale)},l;
try{l=localStorage.getItem(${JSON.stringify(LANGUAGE_KEY)})}catch(e){}
if(locales.indexOf(l)<0){
  var langs=navigator.languages&&navigator.languages.length?navigator.languages:[navigator.language||''];
  l=fallback;
  for(var i=0;i<langs.length;i++){var c=String(langs[i]).slice(0,2).toLowerCase();if(locales.indexOf(c)>=0){l=c;break}}
  try{localStorage.setItem(${JSON.stringify(LANGUAGE_KEY)},l)}catch(e){}
}
location.replace(${JSON.stringify(env.NEXT_PUBLIC_BASE_PATH)}+'/'+l+'/'+location.search+location.hash);
})()`
