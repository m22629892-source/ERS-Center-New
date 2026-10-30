import fs from 'fs';

const newTranslations = {
  user_management: {
    en: 'User Management',
    ku: 'بەڕێوەبردنی بەکارهێنەران',
    fr: 'Gestion des utilisateurs',
    de: 'Benutzerverwaltung'
  },
  add_new_user: {
    en: 'Add New User',
    ku: 'زیادکردنی بەکارهێنەری نوێ',
    fr: 'Ajouter un utilisateur',
    de: 'Neuen Benutzer hinzufügen'
  },
  delete_selected: {
    en: 'Delete Selected',
    ku: 'سڕینەوەی دیاریکراوەکان',
    fr: 'Supprimer la sélection',
    de: 'Ausgewählte löschen'
  },
  search_users_placeholder: {
    en: 'Search by name or username...',
    ku: 'گەڕان بەپێی ناو یان ناوی بەکارهێنەر...',
    fr: 'Recherche par nom ou nom d\'utilisateur...',
    de: 'Suche nach Name oder Benutzername...'
  },
  all_roles: {
    en: 'All Roles',
    ku: 'هەموو ڕۆڵەکان',
    fr: 'Tous les rôles',
    de: 'Alle Rollen'
  },
  edit_user_data: {
    en: 'Edit User Details',
    ku: 'دەستکاریکردنی زانیاری بەکارهێنەر',
    fr: 'Modifier les données de l\'utilisateur',
    de: 'Benutzerdaten bearbeiten'
  },
  create_new_account: {
    en: 'Create New Account',
    ku: 'دروستکردنی هەژماری نوێ',
    fr: 'Créer un nouveau compte',
    de: 'Neues Konto erstellen'
  },
  enter_real_name: {
    en: 'Enter full real name',
    ku: 'ناوی ڕاستەقینە بنووسە',
    fr: 'Entrez le nom réel',
    de: 'Vollständigen Namen eingeben'
  },
  username_login: {
    en: 'System Login Username',
    ku: 'ناوی چوونەژوورەوەی سیستم',
    fr: 'Identifiant système',
    de: 'System-Anmeldename'
  },
  password_login: {
    en: 'Login Password',
    ku: 'تێپەڕەوشەی چوونەژوورەوە',
    fr: 'Mot de passe',
    de: 'Anmeldepasswort'
  },
  select_role: {
    en: 'Select Role',
    ku: 'دیاریکردنی ڕۆڵ',
    fr: 'Sélectionner le rôle',
    de: 'Rolle auswählen'
  },
  role_user: {
    en: 'Standard User (User)',
    ku: 'بەکارهێنەری ئاسایی',
    fr: 'Utilisateur standard (User)',
    de: 'Standard-Benutzer (User)'
  },
  role_responder: {
    en: 'Field Responder',
    ku: 'وەڵامدەرەوەی مەیدانی',
    fr: 'Intervenant terrain (Responder)',
    de: 'Einsatzkraft (Responder)'
  },
  role_admin: {
    en: 'System Administrator (Admin)',
    ku: 'بەڕێوەبەری سیستم',
    fr: 'Administrateur système (Admin)',
    de: 'Systemadministrator (Admin)'
  },
  add_user_now: {
    en: 'Add User Now',
    ku: 'زیادکردنی بەکارهێنەر ئێستا',
    fr: 'Ajouter l\'utilisateur maintenant',
    de: 'Benutzer jetzt hinzufügen'
  },
  confirm_bulk_delete: {
    en: 'Confirm Bulk Deletion',
    ku: 'دڵنیابوون لە سڕینەوەی بەکۆمەڵ',
    fr: 'Confirmer la suppression groupée',
    de: 'Massenlöschung bestätigen'
  },
  confirm_bulk_delete_msg: {
    en: 'Are you sure you want to delete {{count}} users? This action cannot be undone.',
    ku: 'دڵنیایت لە سڕینەوەی {{count}} بەکارهێنەر؟ ئەم کردارە پاشگەزبوونەوەی نییە.',
    fr: 'Êtes-vous sûr de vouloir supprimer {{count}} utilisateurs ? Cette action est irréversible.',
    de: 'Möchten Sie wirklich {{count}} Benutzer löschen? Diese Aktion kann nicht rückgängig gemacht werden.'
  },
  delete_user: {
    en: 'Delete User',
    ku: 'سڕینەوەی بەکارهێنەر',
    fr: 'Supprimer l\'utilisateur',
    de: 'Benutzer löschen'
  },
  confirm_single_delete_user_msg: {
    en: 'Are you sure you want to permanently delete this user from the system?',
    ku: 'دڵنیایت لە سڕینەوەی هەمیشەیی ئەم بەکارهێنەرە لە سیستم؟',
    fr: 'Êtes-vous sûr de vouloir supprimer définitivement cet utilisateur du système ?',
    de: 'Sind Sie sicher, dass Sie diesen Benutzer dauerhaft aus dem System löschen möchten?'
  },
  save_data_failed: {
    en: 'Failed to save data, please try again later.',
    ku: 'پاشەکەوتکردنی داتا سەرکەوتوو نەبوو، تکایە دواتر هەوڵبدەرەوە.',
    fr: 'Échec de l\'enregistrement des données, veuillez réessayer plus tard.',
    de: 'Daten konnten nicht gespeichert werden, bitte versuchen Sie es später erneut.'
  },
  operations_chat: {
    en: 'Operations Chat',
    ku: 'چاتی ئۆپەراسیۆنەکان',
    fr: 'Chat des opérations',
    de: 'Einsatz-Chat'
  },
  type_message: {
    en: 'Type a message...',
    ku: 'پەیامێک بنووسە...',
    fr: 'Écrivez un message...',
    de: 'Nachricht eingeben...'
  },
  processing_file_upload: {
    en: 'Processing and uploading file...',
    ku: 'پرۆسەکردن و بارکردنی پەڕگە...',
    fr: 'Traitement et téléversement du fichier...',
    de: 'Datei wird verarbeitet und hochgeladen...'
  },
  verification_code: {
    en: 'Verification Code',
    ku: 'کۆدی پشتڕاستکردنەوە',
    fr: 'Code de vérification',
    de: 'Bestätigungscode'
  },
  auto_generated: {
    en: 'Will be auto-generated',
    ku: 'خۆکارانە دروست دەکرێت',
    fr: 'Généré automatiquement',
    de: 'Wird automatisch generiert'
  },
  qr_modal_title: {
    en: 'Quick Response Code (QR)',
    ku: 'کۆدی وەڵامدانەوەی خێرا (QR)',
    fr: 'Code QR',
    de: 'QR-Code'
  },
  print_qr_location: {
    en: 'Print QR for Location',
    ku: 'چاپکردنی کۆد بۆ شوێن',
    fr: 'Imprimer le code pour le lieu',
    de: 'QR-Code für Standort drucken'
  },
  ignored_unconcerned: {
    en: 'Ignored (Not concerned)',
    ku: 'پشتگوێخراو (پەیوەندیدار نییە)',
    fr: 'Ignoré (Non concerné)',
    de: 'Ignoriert (Nicht betroffen)'
  },
  ai_call_prompt: {
    en: 'Call the ERS Smart Response unit for situation summary and immediate guidance.',
    ku: 'پەیوەندی بە یەکەی وەڵامدانەوەی زیرەکی ERS بکە بۆ کورتەی دۆخەکە و ڕێنمایی خێرا.',
    fr: 'Appelez l\'unité d\'intervention intelligente ERS pour un résumé et des directives immédiates.',
    de: 'Rufen Sie die intelligente ERS-Einsatzeinheit für Lageübersicht und Sofortmaßnahmen an.'
  },
  connecting_call: {
    en: 'Connecting...',
    ku: 'پەیوەستبوون...',
    fr: 'Connexion en cours...',
    de: 'Verbinde...'
  },
  start_call_now: {
    en: 'Start Call Now',
    ku: 'دەستپێکردنی پەیوەندی ئێستا',
    fr: 'Démarrer l\'appel',
    de: 'Anruf jetzt starten'
  },
  active_call: {
    en: 'Active Call',
    ku: 'پەیوەندی چالاک',
    fr: 'Appel en cours',
    de: 'Aktiver Anruf'
  },
  waiting_support_summary: {
    en: 'Waiting for technical support summary...',
    ku: 'چاوەڕوانی کورتەی پشتیوانی تەکنیکی...',
    fr: 'En attente du résumé du support...',
    de: 'Warte auf Zusammenfassung...'
  },
  end_call: {
    en: 'End Call',
    ku: 'کۆتاییهێنان بە پەیوەندی',
    fr: 'Mettre fin à l\'appel',
    de: 'Anruf beenden'
  },
  update_keys_in_db: {
    en: 'Update keys in database',
    ku: 'نوێکردنەوەی کلیلەکان لە بنکەدراوەدا',
    fr: 'Mettre à jour les clés dans la base',
    de: 'Schlüssel in Datenbank aktualisieren'
  },
  api_sync_success: {
    en: 'Synced successfully - System is operating in dual mode now.',
    ku: 'هاوکاتکردن سەرکەوتوو بوو - سیستم ئێستا بە شێوازی دووانی کار دەکات.',
    fr: 'Synchronisé avec succès - Le système fonctionne en mode double.',
    de: 'Erfolgreich synchronisiert - System arbeitet nun im Dual-Modus.'
  },
  api_sync_fail: {
    en: 'Error: Failed to reach database to update protocol.',
    ku: 'هەڵە: دەستگەیشتن بە بنکەدراوە بۆ نوێکردنەوەی پرۆتۆکۆڵ سەرکەوتوو نەبوو.',
    fr: 'Erreur : Impossible d\'accéder à la base pour mettre à jour le protocole.',
    de: 'Fehler: Datenbankzugriff zur Protokollaktualisierung fehlgeschlagen.'
  },
  secure_connection_verified: {
    en: 'Verified: Encrypted and secure connection environment',
    ku: 'پشتڕاستکرایەوە: ژینگەی پەیوەندی شفرەکراو و پارێزراوە',
    fr: 'Vérifié : Environnement de connexion chiffré et sécurisé',
    de: 'Verifiziert: Verschlüsselte und sichere Verbindungsumgebung'
  },
  strategic_brain_reports: {
    en: 'Strategic Brain & Reports',
    ku: 'مێشکی ستراتیژی و ڕاپۆرتەکان',
    fr: 'Cerveau stratégique & Rapports',
    de: 'Strategisches Gehirn & Berichte'
  },
  strategic_brain_desc: {
    en: 'Digital brain that generates complex legal reports and insights.',
    ku: 'مێشکێکی دیجیتاڵی کە ڕاپۆرت و داتای یاسایی ئاڵۆز دروست دەکات.',
    fr: 'Cerveau numérique générant des rapports légaux complexes.',
    de: 'Digitales Gehirn zur Erstellung komplexer Berichte.'
  },
  generate_high_res_slides: {
    en: 'Generate high-resolution professional visuals for presentation slides',
    ku: 'وێنەی پیشەیی بە ڕوونی بەرز بۆ سلایدەکانی پێشکەشکردن دروست بکە',
    fr: 'Générez des visuels professionnels haute résolution pour vos diapositives',
    de: 'Professionelle hochauflösende Grafiken für Präsentationsfolien generieren'
  },
  ai_drawing_in_progress: {
    en: 'AI generation in progress...',
    ku: 'کێشانی وێنە بە ژیری دەستکرد...',
    fr: 'Génération IA en cours...',
    de: 'KI-Generierung läuft...'
  },
  regenerate_pro: {
    en: 'Regenerate (Pro)',
    ku: 'دووبارە دروستکردنەوە (Pro)',
    fr: 'Régénérer (Pro)',
    de: 'Neu generieren (Pro)'
  },
  presentation_assets_notice: {
    en: 'Note: This operation requires a paid API key. Generated images are visual assets for your slides.',
    ku: 'تێبینی: ئەم کردارە پێویستی بە کلیلی API پارەپێدراوە. وێنە دروستکراوەکان بەهای بینراون بۆ سلایدەکانت.',
    fr: 'Remarque : Nécessite une clé API payante. Les images générées sont des ressources visuelles pour vos diapositives.',
    de: 'Hinweis: Erfordert einen kostenpflichtigen API-Schlüssel. Die generierten Bilder sind visuelle Assets für Ihre Folien.'
  },
  select_filters_and_generate: {
    en: 'Select filter criteria and click generate',
    ku: 'پێوەرەکانی پاڵاوتن دیاری بکە و داگرتنی دروستکردن بکە',
    fr: 'Sélectionnez les filtres et cliquez sur générer',
    de: 'Filterkriterien auswählen und auf Generieren klicken'
  },
  update_report: {
    en: 'Update Report',
    ku: 'نوێکردنەوەی ڕاپۆرت',
    fr: 'Mettre à jour le rapport',
    de: 'Bericht aktualisieren'
  },
  checklist_version_approved: {
    en: 'New checklist version officially approved and deployed',
    ku: 'وەشانی نوێی لیستەکە پەسەند کرا و بە فەرمی جێگیرکرا',
    fr: 'Nouvelle version de la liste approuvée et déployée',
    de: 'Neue Checklistenversion offiziell genehmigt und bereitgestellt'
  },
  checklist_approval_failed: {
    en: 'Approval failed',
    ku: 'پەسەندکردن سەرکەوتوو نەبوو',
    fr: 'Échec de l\'approbation',
    de: 'Genehmigung fehlgeschlagen'
  },
  checklist_deleted_success: {
    en: 'Checklist deleted successfully',
    ku: 'لیستەکە بە سەرکەوتوویی سڕایەوە',
    fr: 'Liste supprimée avec succès',
    de: 'Checkliste erfolgreich gelöscht'
  },
  checklist_delete_failed: {
    en: 'Deletion failed',
    ku: 'سڕینەوە سەرکەوتوو نەبوو',
    fr: 'Échec de la suppression',
    de: 'Löschen fehlgeschlagen'
  },
  checklists_imported_count: {
    en: 'Imported and approved {{count}} official safety protocols matching emergency response standards.',
    ku: 'هاوردەکردن و پەسەندکردنی {{count}} پرۆتۆکۆڵی سەلامەتی فەرمی کە هاوتایە لەگەڵ ستانداردەکانی وەڵامدانەوەی لەناکاو.',
    fr: 'Importé et approuvé {{count}} protocoles de sécurité officiels conformes aux normes d\'urgence.',
    de: '{{count}} offizielle Sicherheitsprotokolle gemäß Notfallstandards importiert und genehmigt.'
  },
  generate_checklists_failed: {
    en: 'Failed to generate approved checklists',
    ku: 'دروستکردنی لیستە پەسەندکراوەکان سەرکەوتوو نەبوو',
    fr: 'Échec de la génération des listes approuvées',
    de: 'Erstellung der genehmigten Checklisten fehlgeschlagen'
  },
  response_call_for_type: {
    en: 'Response call for {{type}} emergency',
    ku: 'بانگی وەڵامدانەوە بۆ باری {{type}}',
    fr: 'Appel d\'intervention pour {{type}}',
    de: 'Einsatzruf für {{type}}'
  },
  image_generation_failed: {
    en: 'Failed to generate image',
    ku: 'دروستکردنی وێنە سەرکەوتوو نەبوو',
    fr: 'Échec de la génération de l\'image',
    de: 'Bildgenerierung fehlgeschlagen'
  }
};

let content = fs.readFileSync('i18n.ts', 'utf8');

['en', 'ku', 'fr', 'de'].forEach(lang => {
  const targetPattern = `  ${lang}: {\n    translation: {`;
  const idx = content.indexOf(targetPattern);
  if (idx !== -1) {
    let block = '';
    for (const [key, trans] of Object.entries(newTranslations)) {
      block += `\n      "${key}": ${JSON.stringify(trans[lang])},`;
    }
    content = content.slice(0, idx + targetPattern.length) + block + content.slice(idx + targetPattern.length);
  }
});

fs.writeFileSync('i18n.ts', content, 'utf8');
console.log('Successfully synchronized new keys into en, ku, fr, and de!');
