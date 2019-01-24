% mkokot
% Opcije:
%  - plan - podesi stil za plan projekta
%  - tehnicka - podesi stil za tehnicku dokumentaciju (standardna postavka)
%  - lmodern - koristi font lmodern (standardna postavka)
%  - times - koristi font times
%  - utf8 - učitaj inputenc paket i opcijom utf8 (standardna postavka)
%  - cp1250 - učitaj inputenc paket i opcijom cp1250
%  - authoryear - stil citiranja ``(author, year)'' (standardna postavka)
%  - numeric - stil citiranja ``[broj]''

\NeedsTeXFormat{LaTeX2e}
\ProvidesClass{fer}

% Predefinirane vrijednosti opcija
\newif\if@dokuplan		\global\@dokuplanfalse
\newif\if@dokuteh		\global\@dokutehtrue
\newif\if@fontlmodern		\global\@fontlmoderntrue
\newif\if@fonttimes			\global\@fonttimesfalse
\newif\if@citeauthoryear	\global\@citeauthoryeartrue
\newif\if@citenumeric		\global\@citenumericfalse
\newif\if@encutf			\global\@encutftrue
\newif\if@enccp				\global\@enccpfalse

% Postavi font
\DeclareOption{lmodern}{\@fontlmoderntrue%
						\@fonttimesfalse}
\DeclareOption{times}{\@fonttimestrue%
					  \@fontlmodernfalse}

% Tip rada
\DeclareOption{plan_projekta}{\@dokuplantrue%
					  \@dokutehfalse}
\DeclareOption{tehnicka_dokumentacija}{\@dokutehtrue%
					  \@dokuplanfalse}
					  
% Encoding
\DeclareOption{utf8}{\@encutftrue%
					 \@enccpfalse}
\DeclareOption{cp1250}{\@encutffalse%
					 \@enccptrue}

% Način citiranja
\DeclareOption{authoryear}{\@citeauthoryeartrue%
					       \@citenumericfalse}
\DeclareOption{numeric}{\@citeauthoryearfalse%
					    \@citenumerictrue}

\ProcessOptions

\LoadClass[12pt, onecolumn]{report}

\RequirePackage[a4paper, left=3.5cm, right=3cm, bottom=3cm, top=3cm]{geometry}

% Postavljanje encodinga
\if@encutf \RequirePackage[utf8]{inputenc}
\else \if@enccp \RequirePackage[cp1250]{inputenc} \fi
\fi

\RequirePackage[croatian]{babel}
\RequirePackage[T1]{fontenc}
\RequirePackage{graphicx} % Uključeno jer je često korišteno
\RequirePackage{amssymb} % Uključeno jer je često korišteno
\RequirePackage{amsmath} % Uključeno jer je često korišteno
\RequirePackage{fixltx2e}
\RequirePackage{caption}
\RequirePackage{arrayjob}
\RequirePackage{multido}
\RequirePackage{ifthen}
\RequirePackage{url} % Potrebno radi natbiba
\RequirePackage{enumitem} % Potrebno radi izmjene itemize okoline

% Numeriranje literature kod projekta
\RequirePackage[nottoc, numbib, chapter]{tocbibind}

% Postavljanje fonta
\if@fonttimes\RequirePackage{times} \fi
\if@fontlmodern\RequirePackage{lmodern} \fi

% Postavljanje stila citiranja
\if@citeauthoryear \RequirePackage[authoryear, round]{natbib}
\else \RequirePackage[numbers, square]{natbib}
\fi

% Umjesto poziva \RequirePackage[outsidefoot]{pageno}.
% Neke LaTeX distribucije odbijaju automatski instalirati pageno paket.
% Stoga, dio paketa koji se koristi je kopiran u ovu cls datoteku.
\renewcommand{\ps@plain}{%
   \renewcommand{\@mkboth}{\@gobbletwo}%
   \renewcommand{\@oddhead}{}%
   \renewcommand{\@evenhead}{}%
   \renewcommand{\@evenfoot}{\reset@font\rmfamily\thepage\hfil}%
   \renewcommand{\@oddfoot}{\reset@font\rmfamily\hfil\thepage}}
\pagestyle{plain}

\renewcommand{\captionlabelfont}{\bfseries}
\renewcommand{\captionfont}{\small}

% 1.5 prored, 1.3 je faktor za množenje
\linespread{1.3}

% Promjena naziva poglavlja ``Bibliografija'' -> ``Literatura''
\addto\captionscroatian{%
	\def\bibname{Literatura}
}

% Podešavanje oznaka kod listi (1. razina je crtica, 2. puni krug) 
\renewcommand{\labelitemi}{\textendash}
\renewcommand{\labelitemii}{\textbullet}

% http://www.tex.ac.uk/cgi-bin/texfaq2html?label=seccntfmt
% dodaje tocku nakon section broja ali ne i nakon chapter!
% za chapter se koristi jednostavno http://theoval.cmp.uea.ac.uk/~nlct/latex/thesis/node10.html
\renewcommand*{\@seccntformat}[1]{%
  \csname the#1\endcsname.\quad
}

% http://stackoverflow.com/questions/2426963/modifying-latex-table-of-contents-to-add-a-period-after-chapter-table-figure-numb
% Dodaje u toc tocke
\let \savenumberline \numberline
\def \numberline#1{\savenumberline{#1.}}

\renewcommand\theequation{\ifnum \c@chapter>\z@ \thechapter.\fi \@arabic\c@equation}
\renewcommand\thefigure{\ifnum \c@chapter>\z@ \thechapter.\fi \@arabic\c@figure}
\renewcommand\thetable{\ifnum \c@chapter>\z@ \thechapter.\fi \@arabic\c@table}

% TOC
\renewcommand\tableofcontents{%
   \setcounter{page}{2}
   \chapter*{\contentsname
   \@mkboth{%
   \MakeUppercase\contentsname}{\MakeUppercase\contentsname}}%
   \@starttoc{toc}%
}

\newboolean{atappendix}
\setboolean{atappendix}{false}
\newboolean{secondpart}
\setboolean{secondpart}{false}

\renewcommand{\appendix}{
	\setboolean{atappendix}{true}
	\setcounter{chapter}{0}
	\renewcommand{\thechapter}{\Alph{chapter}}
}

\renewcommand{\@makechapterhead}[1]{%
\ifthenelse{\boolean{atappendix}}{%
	\vspace*{50\p@}%
	{\setlength{\parskip}{0em} \parindent \z@ \raggedright \normalfont
		\interlinepenalty\@M
		\ifnum \c@secnumdepth >\m@ne
			\Huge\bfseries Dodatak \thechapter \\ #1
			\par\nobreak
		\fi
		\nobreak
		\vskip 40\p@
	}
}
{
	\ifthenelse{\boolean{secondpart}}
	{
	}
	{
		\setcounter{page}{1}
		\renewcommand{\thepage}{\arabic{page}}
		\setboolean{secondpart}{true}
	}

	\vspace*{50\p@}%
	{\setlength{\parskip}{0em} \parindent \z@ \raggedright \normalfont
		\interlinepenalty\@M
		\ifnum \c@secnumdepth >\m@ne
			\Huge\bfseries \thechapter.~#1
			\par\nobreak
		\fi
		\nobreak
		\vskip 40\p@
	}
}
}

\renewcommand{\@makeschapterhead}[1]{%
\ifthenelse{\boolean{atappendix}}{%
	\vspace*{50\p@}%
	{\setlength{\parskip}{0em} \parindent \z@ \raggedright
		\normalfont
		\interlinepenalty\@Mdef
		\Huge\scshape Dodatak \\ #1\par
		\nobreak
		\vskip 40\p@
	}
}
{%
	\vspace*{50\p@}%
	{\setlength{\parskip}{0em} \parindent \z@ \raggedright
		\normalfont
		\interlinepenalty\@M
		\Huge\scshape #1\par
		\nobreak
		\vskip 40\p@
	}
}
}

\def\voditelj#1{\gdef\@voditelj{#1}}
\def\@voditelj{\@latex@warning@no@line{Voditelj nije naveden.
Koristi \noexpand\voditelj za definiranje}}

\def\size#1{\gdef\@size{#1}}
\def\@size{\@latex@warning@no@line{Broj članova tima nije naveden.
Koristi \noexpand\size za definiranje}}

\def\verzija#1{\gdef\@verzija{#1}}
\def\@verzija{\@latex@warning@no@line{Verzija nije navedena.
Koristi \noexpand\verzija za definiranje}}

\if@titlepage
	\renewcommand\maketitle{%
	\if@dokuplan%
		\lhead{\begin{tabular}{l} \@title \\ Projektna dokumentacija \end{tabular}}%
	\else%
		\lhead{\begin{tabular}{l} \@title \\ Tehni\v{c}ka dokumentacija \end{tabular}}%
	\fi
	\rhead{\begin{tabular}{rc} Verzija:& \@verzija \\ Datum:& \today \end{tabular}}
	\lfoot{FER 2 - Projekt}
	\cfoot{@FER, \the\year}
	\rfoot{Stranica \thepage\ od \pageref{LastPage}}
	
	\begin{titlepage}%
		\let\footnotesize\small
		\let\footnoterule\relax
	
		\begin{flushright}
			{\huge\bfseries\sffamily \@title}
			
			\if@dokuplan%
				{\LARGE\bfseries\sffamily Projektna dokumentacija}%		
			\else {\LARGE\bfseries\sffamily Tehni\v{c}ka dokumentacija}\fi
			
			{\large\bfseries\sffamily Verzija \@verzija}
		\end{flushright}
		\vfill
		\if@dokuteh%
			\begin{flushright}%
			\begin{tabular}{r l}
	    		{\Large\bfseries\sffamily Studentski tim: } & {\Large\sffamily \@author(1)} \\
				\let\ListAuthors\empty
				\begingroup
					\let\@author\relax
					\let\\\relax
					\let\Large\relax
					\let\sffamily\relax
					\multido{\i=2+1}{\@size}{%
						\xdef\ListAuthors{\ListAuthors
							 & \Large\sffamily \@author(\i) \\}}
				\endgroup
				\ListAuthors
				{\Large\bfseries\sffamily Nastavnik: } & {\Large\sffamily \@voditelj}\\
			\end{tabular}
			\end{flushright}\par
			\vfill
		\fi
	\end{titlepage}%
	\setcounter{footnote}{0}%
	\global\let\maketitle\relax
	\global\let\@date\@empty
	\global\let\date\relax
	\global\let\and\relax
	}
\fi

\newdimen\listindentation
\setlength{\listindentation}{3 em}

% Podešavanje izemize okoline
% Zahtjeva enumitem paket
\renewenvironment{itemize}%
{
	\setlength{\parskip}{0em}
	\advance\@itemdepth\@ne
	\edef\@itemitem{labelitem\romannumeral\@itemdepth}%

	\begin{list}{\csname\@itemitem\endcsname}{\setlength{\leftmargin}{\listindentation}\setlength{\itemsep}{0 em}\setlength{\topsep}{0 em}}
}%
{\end{list}}

% Naredba \engl
\newcommand{\engl}[1]{(engl.~\emph{#1})}

% Sažetak na hrvatskom
\newenvironment{sazetak}
{
\newpage
\vspace*{\fill}
\thispagestyle{empty}
\begin{center}
  {\bf \@title}
\end{center}
\hspace*{\fill} {\bf Sa\v{z}etak} \hspace*{\fill} \par
\vspace*{25pt}
}
{
\vspace*{\fill}
}

% Ključne riječi na hrvatskom
\newcommand{\kljucnerijeci}[1]
{
\vspace{15pt}
\noindent \textbf{Klju\v{c}ne rije\v{c}i:} #1
}

% Ključne riječi na engleskom
\newcommand{\keywords}[1]
{
\vspace{15pt}
\noindent \textbf{Keywords:} #1
}

% Sažetak na engleskom
\def\engtitle#1{\gdef\@engtitle{#1}}
\def\@engtitle{\@latex@warning@no@line{Engleski naziv rada nije definiran.
Koristi \noexpand\engtitle za definiranje}}
\renewenvironment{abstract}
{
\vspace*{\fill}
\thispagestyle{empty}
\begin{center}
  {\bf \@engtitle}
\end{center}
\hspace*{\fill} {\bf Abstract} \hspace*{\fill} \par
\vspace*{25pt}
}
{
\vspace*{\fill}
}

\endinput
