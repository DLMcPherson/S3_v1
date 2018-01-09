function json_export_reachset(data,g)

    fileID = fopen('../reachableSets/exported_reachset.json','w');
    TEXT = jsonencode(data);
    fprintf(fileID,"let reachset = { \n");
    fprintf(fileID,"'gdim' : %s \n",jsonencode(g.dim));
    fprintf(fileID,",'gmin' : %s \n",jsonencode(g.min));
    fprintf(fileID,",'gmax' : %s \n",jsonencode(g.max));
    fprintf(fileID,",'gN' : %s \n",jsonencode(g.N));
    fprintf(fileID,",'gdx' : %s \n",jsonencode(g.dx));
    fprintf(fileID,",'data' : %s \n",TEXT);
    fprintf(fileID,"}");
    fclose(fileID);

end