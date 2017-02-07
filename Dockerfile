FROM ubuntu:14.04
			 
RUN apt-get -y update

RUN apt-get install  -y language-pack-ko
			 
# set locale ko_KR
RUN locale-gen ko_KR.UTF-8

ENV LANG ko_KR.UTF-8
ENV LANGUAGE ko_KR.UTF-8
ENV LC_ALL ko_KR.UTF-8

RUN apt-get install -y nginx

RUN rm -f /etc/nginx/sites-available/default 
#RUN rm -f /etc/nginx/nginx.conf 

ADD conf/default /etc/nginx/sites-available/
#ADD conf/nginx.conf /etc/nginx/
ADD conf/aircomix.conf /etc/nginx/sites-enabled/
ADD conf/airnovel.conf /etc/nginx/sites-enabled/

RUN apt-get install -y php5-fpm

VOLUME ["/var/comix","/var/novel","/var/www/comix","/var/www/novel","/var/script"]

#ADD script/start.sh /var/script/
#RUN chmod 755 /var/script/start.sh

EXPOSE 80
EXPOSE 31257
EXPOSE 31357

#CMD ["/bin/bash","/var/script/start.sh"]
CMD ["/etc/init.d/nginx","start"]
CMD ["/etc/init.d/php5-fpm","start"]
CMD /bin/bash
