function json_export_reachset(data,g,filename,infoldername)

    if(nargin > 3)
        foldername = infoldername;
    else
        foldername = "../reachableSets/";
    end

    fileID = fopen(foldername+filename+"_reachset.json","w");
    TEXT = jsonencode(data);
    %fprintf(fileID,'let reachset = { \n');
    fprintf(fileID,'{ \n');
    fprintf(fileID,'"gdim" : %s \n',jsonencode(g.dim));
    fprintf(fileID,',"gmin" : %s \n',jsonencode(g.min));
    fprintf(fileID,',"gmax" : %s \n',jsonencode(g.max));
    fprintf(fileID,',"gN" : %s \n',jsonencode(g.N));
    fprintf(fileID,',"gdx" : %s \n',jsonencode(g.dx));
    fprintf(fileID,',"data" : %s \n',TEXT);
    fprintf(fileID,'}');
    fclose(fileID);
    
    save(foldername+filename+"_reachset.mat",'data','g');

end