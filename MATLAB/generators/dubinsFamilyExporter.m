for famii = 1:length(valuesFamily)
    json_export_reachset(valuesFamily{famii},gridDataFamily{famii},"dubins_w"+(gridDataFamily{famii}.wMax*1000)+"_s"+(gridDataFamily{famii}.sigma*1000))
end