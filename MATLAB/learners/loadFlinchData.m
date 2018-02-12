function object = loadFlinchData(filename)
    fileID = fopen(filename,'r','n','UTF-8');
    text = fscanf(fileID," %s ");
    object = jsondecode(text(2:end) );
end
