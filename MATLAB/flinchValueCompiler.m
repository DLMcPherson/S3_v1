for participantID = 1:12
   flinches = loadFlinchData("../../Experiments/"+participantID+"/supervisorFlinches.dat"); 
   flinchPoints{participantID} = matrixifyFlinchData(flinches);
end